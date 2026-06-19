from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.db import get_db
from backend.models import Produto
from backend.schemas import ProdutoCreate, ProdutoUpdate, ProdutoResponse

router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)


@router.post("/", response_model=ProdutoResponse)
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    produto_existente_codigo = db.query(Produto).filter(Produto.codigo == produto.codigo).first()
    if produto_existente_codigo:
        raise HTTPException(status_code=400, detail="Código do produto já cadastrado.")

    if produto.codigo_barras:
        produto_existente_barras = db.query(Produto).filter(
            Produto.codigo_barras == produto.codigo_barras
        ).first()
        if produto_existente_barras:
            raise HTTPException(status_code=400, detail="Código de barras já cadastrado.")

    novo_produto = Produto(
        nome=produto.nome,
        descricao=produto.descricao,
        categoria=produto.categoria,
        codigo=produto.codigo,
        codigo_barras=produto.codigo_barras,
        preco_custo=produto.preco_custo,
        preco_venda=produto.preco_venda,
        estoque=produto.estoque,
        estoque_minimo=produto.estoque_minimo,
        ativo=produto.ativo
    )

    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return novo_produto


@router.get("/", response_model=list[ProdutoResponse])
def listar_produtos(
    busca: str = Query(default=None),
    somente_ativos: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    query = db.query(Produto)

    if busca:
        termo = f"%{busca}%"
        query = query.filter(
            or_(
                Produto.nome.ilike(termo),
                Produto.codigo.ilike(termo),
                Produto.codigo_barras.ilike(termo),
                Produto.categoria.ilike(termo)
            )
        )

    if somente_ativos:
        query = query.filter(Produto.ativo == True)

    produtos = query.order_by(Produto.id.desc()).all()
    return produtos


@router.get("/{produto_id}", response_model=ProdutoResponse)
def buscar_produto_por_id(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
    return produto


@router.put("/{produto_id}", response_model=ProdutoResponse)
def atualizar_produto(produto_id: int, dados: ProdutoUpdate, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    if dados.codigo and dados.codigo != produto.codigo:
        codigo_existente = db.query(Produto).filter(
            Produto.codigo == dados.codigo,
            Produto.id != produto_id
        ).first()
        if codigo_existente:
            raise HTTPException(status_code=400, detail="Código do produto já cadastrado.")

    if dados.codigo_barras and dados.codigo_barras != produto.codigo_barras:
        barras_existente = db.query(Produto).filter(
            Produto.codigo_barras == dados.codigo_barras,
            Produto.id != produto_id
        ).first()
        if barras_existente:
            raise HTTPException(status_code=400, detail="Código de barras já cadastrado.")

    dados_dict = dados.model_dump(exclude_unset=True)

    for campo, valor in dados_dict.items():
        setattr(produto, campo, valor)

    db.commit()
    db.refresh(produto)
    return produto


@router.delete("/{produto_id}")
def excluir_produto(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")

    db.delete(produto)
    db.commit()
    return {"mensagem": "Produto excluído com sucesso."}