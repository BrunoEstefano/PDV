from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Caixa, Cliente, ItemVenda, Venda

router = APIRouter(
    prefix="/relatorios",
    tags=["Relatórios"]
)


def inicio_fim_periodo(data_inicio: str | None, data_fim: str | None):
    if data_inicio:
        inicio = datetime.strptime(data_inicio, "%Y-%m-%d")
    else:
        hoje = datetime.now()
        inicio = datetime(hoje.year, hoje.month, 1)

    if data_fim:
        fim = datetime.strptime(data_fim, "%Y-%m-%d") + timedelta(days=1)
    else:
        hoje = datetime.now()
        fim = datetime(hoje.year, hoje.month, hoje.day) + timedelta(days=1)

    return inicio, fim


@router.get("/resumo")
def relatorio_resumo(
    data_inicio: str | None = Query(default=None),
    data_fim: str | None = Query(default=None),
    db: Session = Depends(get_db)
):
    inicio, fim = inicio_fim_periodo(data_inicio, data_fim)

    vendas = db.query(Venda).filter(
        Venda.data_hora >= inicio,
        Venda.data_hora < fim
    ).all()

    total_vendas = len(vendas)
    faturamento = sum(float(v.total or 0) for v in vendas)
    ticket_medio = (faturamento / total_vendas) if total_vendas > 0 else 0

    dinheiro = sum(
        float(v.total or 0)
        for v in vendas
        if (v.forma_pagamento or "").lower() == "dinheiro"
    )
    pix = sum(
        float(v.total or 0)
        for v in vendas
        if (v.forma_pagamento or "").lower() == "pix"
    )
    cartao = sum(
        float(v.total or 0)
        for v in vendas
        if "cartão" in (v.forma_pagamento or "").lower()
        or "cartao" in (v.forma_pagamento or "").lower()
    )

    return {
        "periodo_inicio": inicio,
        "periodo_fim": fim - timedelta(seconds=1),
        "quantidade_vendas": total_vendas,
        "faturamento": faturamento,
        "ticket_medio": ticket_medio,
        "por_pagamento": {
            "dinheiro": dinheiro,
            "pix": pix,
            "cartao": cartao
        }
    }


@router.get("/produtos-mais-vendidos")
def produtos_mais_vendidos(
    data_inicio: str | None = Query(default=None),
    data_fim: str | None = Query(default=None),
    limite: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    inicio, fim = inicio_fim_periodo(data_inicio, data_fim)

    resultados = (
        db.query(
            ItemVenda.produto_id.label("produto_id"),
            func.sum(ItemVenda.quantidade).label("quantidade_total"),
            func.sum(ItemVenda.subtotal).label("valor_total")
        )
        .join(Venda, Venda.id == ItemVenda.venda_id)
        .filter(Venda.data_hora >= inicio, Venda.data_hora < fim)
        .group_by(ItemVenda.produto_id)
        .order_by(func.sum(ItemVenda.quantidade).desc())
        .limit(limite)
        .all()
    )

    return [
        {
            "produto_id": r.produto_id,
            "quantidade_total": float(r.quantidade_total or 0),
            "valor_total": float(r.valor_total or 0)
        }
        for r in resultados
    ]


@router.get("/clientes-que-mais-compram")
def clientes_que_mais_compram(
    data_inicio: str | None = Query(default=None),
    data_fim: str | None = Query(default=None),
    limite: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    inicio, fim = inicio_fim_periodo(data_inicio, data_fim)

    resultados = (
        db.query(
            Cliente.nome.label("cliente"),
            Cliente.cpf_cnpj.label("cpf_cnpj"),
            func.count(Venda.id).label("quantidade_vendas"),
            func.sum(Venda.total).label("valor_total")
        )
        .join(Venda, Venda.cliente_id == Cliente.id)
        .filter(Venda.data_hora >= inicio, Venda.data_hora < fim)
        .group_by(Cliente.nome, Cliente.cpf_cnpj)
        .order_by(func.sum(Venda.total).desc())
        .limit(limite)
        .all()
    )

    return [
        {
            "cliente": r.cliente,
            "cpf_cnpj": r.cpf_cnpj,
            "quantidade_vendas": int(r.quantidade_vendas or 0),
            "valor_total": float(r.valor_total or 0)
        }
        for r in resultados
    ]


@router.get("/caixas")
def relatorio_caixas(db: Session = Depends(get_db)):
    caixas = db.query(Caixa).order_by(Caixa.id.desc()).all()

    return [
        {
            "id": c.id,
            "data_abertura": c.data_abertura,
            "data_fechamento": c.data_fechamento,
            "valor_inicial": c.valor_inicial,
            "saldo_atual": c.saldo_atual,
            "fechamento_informado": getattr(c, "fechamento_informado", None),
            "status": c.status,
            "observacao": c.observacao
        }
        for c in caixas
    ]