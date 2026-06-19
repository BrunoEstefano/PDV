from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from backend.db import SessionLocal
from backend import models, schemas

router = APIRouter(tags=["Vendas"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


FUSO_PORTO_VELHO = timezone(timedelta(hours=-4))


def agora_porto_velho():
    return datetime.now(FUSO_PORTO_VELHO).replace(tzinfo=None)


@router.post("/vendas/", response_model=schemas.VendaResponse)
def criar_venda(payload: schemas.VendaCreate, db: Session = Depends(get_db)):
    if not payload.itens or len(payload.itens) == 0:
        raise HTTPException(status_code=400, detail="A venda precisa ter pelo menos 1 item.")

    caixa = db.query(models.Caixa).filter(models.Caixa.id == payload.caixa_id).first()
    if not caixa:
        raise HTTPException(status_code=404, detail="Caixa não encontrado.")

    if getattr(caixa, "status", None) != "aberto":
        raise HTTPException(status_code=400, detail="O caixa informado não está aberto.")

    subtotal = 0.0
    itens_processados = []

    for item_payload in payload.itens:
        produto = db.query(models.Produto).filter(
            models.Produto.id == item_payload.produto_id
        ).first()

        if not produto:
            raise HTTPException(
                status_code=404,
                detail=f"Produto ID {item_payload.produto_id} não encontrado."
            )

        quantidade = float(item_payload.quantidade or 0)
        if quantidade <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Quantidade inválida para o produto {produto.nome}."
            )

        estoque_atual = float(getattr(produto, "estoque", 0) or 0)
        if estoque_atual < quantidade:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente para o produto {produto.nome}."
            )

        preco_unitario = float(getattr(produto, "preco_venda", 0) or 0)
        subtotal_item = preco_unitario * quantidade
        subtotal += subtotal_item

        itens_processados.append({
            "produto": produto,
            "quantidade": quantidade,
            "preco_unitario": preco_unitario,
            "subtotal": subtotal_item
        })

    desconto = float(payload.desconto or 0)
    if desconto < 0:
        desconto = 0

    total = subtotal - desconto
    if total < 0:
        total = 0

    valor_recebido = float(payload.valor_recebido or 0)
    troco = 0.0
    if valor_recebido > total:
        troco = valor_recebido - total

    nova_venda = models.Venda(
        cliente_id=payload.cliente_id,
        caixa_id=payload.caixa_id,
        forma_pagamento=payload.forma_pagamento,
        valor_recebido=valor_recebido,
        desconto=desconto,
        subtotal=subtotal,
        total=total,
        troco=troco,
        observacao=payload.observacao,
        operador=payload.operador,
        data_hora=agora_porto_velho()
    )

    db.add(nova_venda)
    db.flush()

    for item in itens_processados:
        produto = item["produto"]

        novo_item = models.ItemVenda(
            venda_id=nova_venda.id,
            produto_id=produto.id,
            quantidade=item["quantidade"],
            preco_unitario=item["preco_unitario"],
            subtotal=item["subtotal"]
        )
        db.add(novo_item)

        produto.estoque = float(produto.estoque or 0) - item["quantidade"]

    caixa.saldo_atual = float(getattr(caixa, "saldo_atual", 0) or 0) + total

    db.commit()

    venda = db.query(models.Venda).options(
        joinedload(models.Venda.cliente),
        joinedload(models.Venda.itens).joinedload(models.ItemVenda.produto)
    ).filter(models.Venda.id == nova_venda.id).first()

    return venda


@router.get("/vendas/", response_model=list[schemas.VendaResponse])
def listar_vendas(db: Session = Depends(get_db)):
    vendas = db.query(models.Venda).options(
        joinedload(models.Venda.cliente),
        joinedload(models.Venda.itens).joinedload(models.ItemVenda.produto)
    ).order_by(models.Venda.id.desc()).all()

    return vendas


@router.get("/vendas/{venda_id}", response_model=schemas.VendaResponse)
def buscar_venda(venda_id: int, db: Session = Depends(get_db)):
    venda = db.query(models.Venda).options(
        joinedload(models.Venda.cliente),
        joinedload(models.Venda.itens).joinedload(models.ItemVenda.produto)
    ).filter(models.Venda.id == venda_id).first()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada.")

    return venda