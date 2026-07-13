from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.db import get_db
from backend import models, schemas

router = APIRouter(
    prefix="/garantias",
    tags=["Garantias"]
)


# =========================
# GARANTIA CELULAR
# =========================

@router.get("/celular", response_model=list[schemas.GarantiaCelularResponse])
def listar_garantias_celular(
    busca: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.GarantiaCelular).options(
        joinedload(models.GarantiaCelular.cliente)
    )

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                models.GarantiaCelular.nome_cliente.ilike(termo),
                models.GarantiaCelular.telefone.ilike(termo),
                models.GarantiaCelular.aparelho.ilike(termo),
                models.GarantiaCelular.imei_serial.ilike(termo),
                models.GarantiaCelular.defeito_servico.ilike(termo),
                models.GarantiaCelular.prazo_garantia.ilike(termo),
                models.GarantiaCelular.status.ilike(termo),
                models.GarantiaCelular.observacao.ilike(termo),
            )
        )

    return query.order_by(models.GarantiaCelular.id.desc()).all()


@router.get("/celular/{garantia_id}", response_model=schemas.GarantiaCelularResponse)
def buscar_garantia_celular(garantia_id: int, db: Session = Depends(get_db)):
    garantia = (
        db.query(models.GarantiaCelular)
        .options(joinedload(models.GarantiaCelular.cliente))
        .filter(models.GarantiaCelular.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de celular não encontrada.")

    return garantia


@router.post("/celular", response_model=schemas.GarantiaCelularResponse)
def criar_garantia_celular(
    payload: schemas.GarantiaCelularCreate,
    db: Session = Depends(get_db)
):
    if not payload.nome_cliente.strip():
        raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório.")

    if payload.cliente_id is not None:
        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == payload.cliente_id)
            .first()
        )
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    nova_garantia = models.GarantiaCelular(
        cliente_id=payload.cliente_id,
        nome_cliente=payload.nome_cliente.strip(),
        telefone=payload.telefone,
        aparelho=payload.aparelho,
        imei_serial=payload.imei_serial,
        defeito_servico=payload.defeito_servico,
        data_entrada=payload.data_entrada,
        prazo_garantia=payload.prazo_garantia or "30 dias",
        status=payload.status or "Ativa",
        observacao=payload.observacao
    )

    db.add(nova_garantia)
    db.commit()
    db.refresh(nova_garantia)

    garantia = (
        db.query(models.GarantiaCelular)
        .options(joinedload(models.GarantiaCelular.cliente))
        .filter(models.GarantiaCelular.id == nova_garantia.id)
        .first()
    )

    return garantia


@router.put("/celular/{garantia_id}", response_model=schemas.GarantiaCelularResponse)
def atualizar_garantia_celular(
    garantia_id: int,
    payload: schemas.GarantiaCelularUpdate,
    db: Session = Depends(get_db)
):
    garantia = (
        db.query(models.GarantiaCelular)
        .filter(models.GarantiaCelular.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de celular não encontrada.")

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
        setattr(garantia, campo, valor)

    db.commit()
    db.refresh(garantia)

    garantia = (
        db.query(models.GarantiaCelular)
        .options(joinedload(models.GarantiaCelular.cliente))
        .filter(models.GarantiaCelular.id == garantia.id)
        .first()
    )

    return garantia


@router.delete("/celular/{garantia_id}")
def excluir_garantia_celular(garantia_id: int, db: Session = Depends(get_db)):
    garantia = (
        db.query(models.GarantiaCelular)
        .filter(models.GarantiaCelular.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de celular não encontrada.")

    db.delete(garantia)
    db.commit()

    return {"mensagem": "Garantia de celular excluída com sucesso."}


# =========================
# GARANTIA TELA
# =========================

@router.get("/tela", response_model=list[schemas.GarantiaTelaResponse])
def listar_garantias_tela(
    busca: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    query = db.query(models.GarantiaTela).options(
        joinedload(models.GarantiaTela.cliente)
    )

    if busca:
        termo = f"%{busca.strip()}%"
        query = query.filter(
            or_(
                models.GarantiaTela.nome_cliente.ilike(termo),
                models.GarantiaTela.telefone.ilike(termo),
                models.GarantiaTela.aparelho.ilike(termo),
                models.GarantiaTela.tipo_tela.ilike(termo),
                models.GarantiaTela.servico_realizado.ilike(termo),
                models.GarantiaTela.prazo_garantia.ilike(termo),
                models.GarantiaTela.status.ilike(termo),
                models.GarantiaTela.observacao.ilike(termo),
            )
        )

    return query.order_by(models.GarantiaTela.id.desc()).all()


@router.get("/tela/{garantia_id}", response_model=schemas.GarantiaTelaResponse)
def buscar_garantia_tela(garantia_id: int, db: Session = Depends(get_db)):
    garantia = (
        db.query(models.GarantiaTela)
        .options(joinedload(models.GarantiaTela.cliente))
        .filter(models.GarantiaTela.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de tela não encontrada.")

    return garantia


@router.post("/tela", response_model=schemas.GarantiaTelaResponse)
def criar_garantia_tela(
    payload: schemas.GarantiaTelaCreate,
    db: Session = Depends(get_db)
):
    if not payload.nome_cliente.strip():
        raise HTTPException(status_code=400, detail="Nome do cliente é obrigatório.")

    if payload.cliente_id is not None:
        cliente = (
            db.query(models.Cliente)
            .filter(models.Cliente.id == payload.cliente_id)
            .first()
        )
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    nova_garantia = models.GarantiaTela(
        cliente_id=payload.cliente_id,
        nome_cliente=payload.nome_cliente.strip(),
        telefone=payload.telefone,
        aparelho=payload.aparelho,
        tipo_tela=payload.tipo_tela,
        servico_realizado=payload.servico_realizado,
        data_troca=payload.data_troca,
        prazo_garantia=payload.prazo_garantia or "30 dias",
        status=payload.status or "Ativa",
        observacao=payload.observacao
    )

    db.add(nova_garantia)
    db.commit()
    db.refresh(nova_garantia)

    garantia = (
        db.query(models.GarantiaTela)
        .options(joinedload(models.GarantiaTela.cliente))
        .filter(models.GarantiaTela.id == nova_garantia.id)
        .first()
    )

    return garantia


@router.put("/tela/{garantia_id}", response_model=schemas.GarantiaTelaResponse)
def atualizar_garantia_tela(
    garantia_id: int,
    payload: schemas.GarantiaTelaUpdate,
    db: Session = Depends(get_db)
):
    garantia = (
        db.query(models.GarantiaTela)
        .filter(models.GarantiaTela.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de tela não encontrada.")

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
        setattr(garantia, campo, valor)

    db.commit()
    db.refresh(garantia)

    garantia = (
        db.query(models.GarantiaTela)
        .options(joinedload(models.GarantiaTela.cliente))
        .filter(models.GarantiaTela.id == garantia.id)
        .first()
    )

    return garantia


@router.delete("/tela/{garantia_id}")
def excluir_garantia_tela(garantia_id: int, db: Session = Depends(get_db)):
    garantia = (
        db.query(models.GarantiaTela)
        .filter(models.GarantiaTela.id == garantia_id)
        .first()
    )

    if not garantia:
        raise HTTPException(status_code=404, detail="Garantia de tela não encontrada.")

    db.delete(garantia)
    db.commit()

    return {"mensagem": "Garantia de tela excluída com sucesso."}