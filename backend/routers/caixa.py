from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db import get_db
from backend import models, schemas

router = APIRouter(prefix="/caixa", tags=["Caixa"])


@router.get("/aberto", response_model=schemas.CaixaResponse)
def obter_caixa_aberto(db: Session = Depends(get_db)):
    caixa = (
        db.query(models.Caixa)
        .filter(models.Caixa.status == "aberto")
        .order_by(models.Caixa.id.desc())
        .first()
    )

    if not caixa:
        raise HTTPException(status_code=404, detail="Nenhum caixa aberto.")

    return caixa


@router.get("/historico", response_model=list[schemas.CaixaResponse])
def listar_historico_caixas(db: Session = Depends(get_db)):
    caixas = db.query(models.Caixa).order_by(models.Caixa.id.desc()).all()
    return caixas


@router.post("/abrir", response_model=schemas.CaixaResponse)
def abrir_caixa(dados: schemas.CaixaCreate, db: Session = Depends(get_db)):
    caixa_aberto = (
        db.query(models.Caixa)
        .filter(models.Caixa.status == "aberto")
        .first()
    )

    if caixa_aberto:
        raise HTTPException(status_code=400, detail="Já existe um caixa aberto.")

    novo_caixa = models.Caixa(
        data_abertura=datetime.now(),
        valor_inicial=dados.valor_inicial,
        saldo_atual=dados.valor_inicial,
        status="aberto",
        observacao=dados.observacao
    )

    db.add(novo_caixa)
    db.commit()
    db.refresh(novo_caixa)

    movimentacao_abertura = models.MovimentacaoCaixa(
        caixa_id=novo_caixa.id,
        tipo="abertura",
        valor=dados.valor_inicial,
        observacao=dados.observacao,
        data_hora=datetime.now()
    )

    db.add(movimentacao_abertura)
    db.commit()
    db.refresh(novo_caixa)

    return novo_caixa


@router.post("/movimentar", response_model=schemas.CaixaResponse)
def movimentar_caixa(dados: schemas.MovimentacaoCaixaCreate, db: Session = Depends(get_db)):
    caixa = (
        db.query(models.Caixa)
        .filter(models.Caixa.status == "aberto")
        .order_by(models.Caixa.id.desc())
        .first()
    )

    if not caixa:
        raise HTTPException(status_code=404, detail="Nenhum caixa aberto.")

    tipo = (dados.tipo or "").strip().lower()

    if tipo not in ["suprimento", "sangria"]:
        raise HTTPException(status_code=400, detail="Tipo de movimentação inválido.")

    valor = float(dados.valor or 0)

    if valor <= 0:
        raise HTTPException(status_code=400, detail="O valor da movimentação deve ser maior que zero.")

    if tipo == "suprimento":
        caixa.saldo_atual += valor
    else:
        if valor > caixa.saldo_atual:
            raise HTTPException(status_code=400, detail="Saldo insuficiente para sangria.")
        caixa.saldo_atual -= valor

    movimentacao = models.MovimentacaoCaixa(
        caixa_id=caixa.id,
        tipo=tipo,
        valor=valor,
        observacao=dados.observacao,
        data_hora=datetime.now()
    )

    db.add(movimentacao)
    db.commit()
    db.refresh(caixa)

    return caixa


@router.post("/fechar", response_model=schemas.CaixaResponse)
def fechar_caixa(dados: schemas.CaixaFechamento, db: Session = Depends(get_db)):
    caixa = (
        db.query(models.Caixa)
        .filter(models.Caixa.status == "aberto")
        .order_by(models.Caixa.id.desc())
        .first()
    )

    if not caixa:
        raise HTTPException(status_code=404, detail="Nenhum caixa aberto para fechar.")

    caixa.status = "fechado"
    caixa.data_fechamento = datetime.now()
    caixa.fechamento_informado = dados.fechamento_informado

    if dados.observacao:
        caixa.observacao = dados.observacao

    movimentacao_fechamento = models.MovimentacaoCaixa(
        caixa_id=caixa.id,
        tipo="fechamento",
        valor=0,
        observacao=dados.observacao,
        data_hora=datetime.now()
    )

    db.add(movimentacao_fechamento)
    db.commit()
    db.refresh(caixa)

    return caixa