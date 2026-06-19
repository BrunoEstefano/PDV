from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.db import get_db
from backend import models, schemas

router = APIRouter(
    prefix="/orcamentos",
    tags=["Orçamentos"]
)


@router.get("/", response_model=list[schemas.OrcamentoResponse])
def listar_orcamentos(
    busca: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Orcamento).options(
        joinedload(models.Orcamento.cliente)
    )

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                models.Orcamento.nome_cliente.ilike(termo),
                models.Orcamento.whatsapp.ilike(termo),
                models.Orcamento.aparelho.ilike(termo),
                models.Orcamento.marca.ilike(termo),
                models.Orcamento.modelo.ilike(termo),
                models.Orcamento.imei_serial.ilike(termo),
                models.Orcamento.servico.ilike(termo),
                models.Orcamento.defeito_relatado.ilike(termo),
                models.Orcamento.status.ilike(termo),
                models.Orcamento.operador.ilike(termo),
            )
        )

    return query.order_by(models.Orcamento.id.desc()).all()


@router.get("/{orcamento_id}", response_model=schemas.OrcamentoResponse)
def buscar_orcamento(orcamento_id: int, db: Session = Depends(get_db)):
    orcamento = (
        db.query(models.Orcamento)
        .options(joinedload(models.Orcamento.cliente))
        .filter(models.Orcamento.id == orcamento_id)
        .first()
    )

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    return orcamento


@router.post("/", response_model=schemas.OrcamentoResponse)
def criar_orcamento(
    payload: schemas.OrcamentoCreate,
    db: Session = Depends(get_db)
):
    cliente = None

    if payload.cliente_id is not None:
        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == payload.cliente_id)
            .first()
        )

        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    nome_cliente = payload.nome_cliente.strip()
    if not nome_cliente:
        raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório.")

    novo_orcamento = models.Orcamento(
        cliente_id=payload.cliente_id,
        nome_cliente=nome_cliente,
        whatsapp=payload.whatsapp,
        aparelho=payload.aparelho,
        marca=payload.marca,
        modelo=payload.modelo,
        imei_serial=payload.imei_serial,
        servico=payload.servico,
        defeito_relatado=payload.defeito_relatado,
        observacao=payload.observacao,
        valor=payload.valor or 0,
        status=payload.status or "Pendente",
        operador=payload.operador
    )

    db.add(novo_orcamento)
    db.commit()
    db.refresh(novo_orcamento)

    orcamento = (
        db.query(models.Orcamento)
        .options(joinedload(models.Orcamento.cliente))
        .filter(models.Orcamento.id == novo_orcamento.id)
        .first()
    )

    return orcamento


@router.put("/{orcamento_id}", response_model=schemas.OrcamentoResponse)
def atualizar_orcamento(
    orcamento_id: int,
    payload: schemas.OrcamentoUpdate,
    db: Session = Depends(get_db)
):
    orcamento = (
        db.query(models.Orcamento)
        .filter(models.Orcamento.id == orcamento_id)
        .first()
    )

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    dados = payload.model_dump(exclude_unset=True)

    if "cliente_id" in dados and dados["cliente_id"] is not None:
        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == dados["cliente_id"])
            .first()
        )

        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    if "nome_cliente" in dados:
        nome_cliente = (dados["nome_cliente"] or "").strip()
        if not nome_cliente:
            raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório.")
        dados["nome_cliente"] = nome_cliente

    for campo, valor in dados.items():
        setattr(orcamento, campo, valor)

    db.commit()
    db.refresh(orcamento)

    orcamento = (
        db.query(models.Orcamento)
        .options(joinedload(models.Orcamento.cliente))
        .filter(models.Orcamento.id == orcamento.id)
        .first()
    )

    return orcamento


@router.delete("/{orcamento_id}")
def excluir_orcamento(orcamento_id: int, db: Session = Depends(get_db)):
    orcamento = (
        db.query(models.Orcamento)
        .filter(models.Orcamento.id == orcamento_id)
        .first()
    )

    if not orcamento:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado.")

    db.delete(orcamento)
    db.commit()

    return {"mensagem": "Orçamento excluído com sucesso."}