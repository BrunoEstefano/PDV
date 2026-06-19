from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from hashlib import sha256

from backend.db import SessionLocal
from backend import models, schemas

router = APIRouter(tags=["Usuários"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def gerar_hash_senha(senha: str) -> str:
    return sha256(senha.encode("utf-8")).hexdigest()


def aplicar_permissoes_por_perfil(novo_usuario: models.Usuario):
    if novo_usuario.perfil == "dono":
        novo_usuario.pode_vender = True
        novo_usuario.pode_cadastrar_cliente = True
        novo_usuario.pode_editar_cliente = True
        novo_usuario.pode_ver_produtos = True
        novo_usuario.pode_cadastrar_produto = True
        novo_usuario.pode_editar_produto = True
        novo_usuario.pode_alterar_estoque = True
        novo_usuario.pode_abrir_caixa = True
        novo_usuario.pode_fechar_caixa = True
        novo_usuario.pode_fazer_sangria = True
        novo_usuario.pode_fazer_suprimento = True
        novo_usuario.pode_ver_relatorios = True
        novo_usuario.pode_usar_orcamentos = True
        novo_usuario.pode_excluir_registros = True
        novo_usuario.pode_cadastrar_usuarios = True


@router.post("/usuarios/", response_model=schemas.UsuarioResponse)
def criar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(models.Usuario).filter(
        models.Usuario.usuario == usuario.usuario.strip().lower()
    ).first()

    if usuario_existente:
        raise HTTPException(status_code=400, detail="Usuário já cadastrado.")

    perfil = usuario.perfil.strip().lower()
    if perfil not in ["dono", "funcionario"]:
        raise HTTPException(status_code=400, detail="Perfil inválido. Use 'dono' ou 'funcionario'.")

    novo_usuario = models.Usuario(
        nome=usuario.nome.strip(),
        usuario=usuario.usuario.strip().lower(),
        senha_hash=gerar_hash_senha(usuario.senha),
        perfil=perfil,
        ativo=usuario.ativo,

        pode_vender=usuario.pode_vender,
        pode_cadastrar_cliente=usuario.pode_cadastrar_cliente,
        pode_editar_cliente=usuario.pode_editar_cliente,
        pode_ver_produtos=usuario.pode_ver_produtos,
        pode_cadastrar_produto=usuario.pode_cadastrar_produto,
        pode_editar_produto=usuario.pode_editar_produto,
        pode_alterar_estoque=usuario.pode_alterar_estoque,
        pode_abrir_caixa=usuario.pode_abrir_caixa,
        pode_fechar_caixa=usuario.pode_fechar_caixa,
        pode_fazer_sangria=usuario.pode_fazer_sangria,
        pode_fazer_suprimento=usuario.pode_fazer_suprimento,
        pode_ver_relatorios=usuario.pode_ver_relatorios,
        pode_usar_orcamentos=usuario.pode_usar_orcamentos,
        pode_excluir_registros=usuario.pode_excluir_registros,
        pode_cadastrar_usuarios=usuario.pode_cadastrar_usuarios
    )

    aplicar_permissoes_por_perfil(novo_usuario)

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


@router.get("/usuarios/", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).order_by(models.Usuario.id.desc()).all()


@router.get("/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return usuario


@router.put("/usuarios/{usuario_id}", response_model=schemas.UsuarioResponse)
def atualizar_usuario(usuario_id: int, payload: schemas.UsuarioUpdate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    dados = payload.dict(exclude_unset=True)

    if "usuario" in dados and dados["usuario"]:
        novo_usuario = dados["usuario"].strip().lower()

        usuario_existente = db.query(models.Usuario).filter(
            models.Usuario.usuario == novo_usuario,
            models.Usuario.id != usuario_id
        ).first()

        if usuario_existente:
            raise HTTPException(status_code=400, detail="Já existe outro usuário com esse login.")

        usuario.usuario = novo_usuario

    if "nome" in dados and dados["nome"] is not None:
        usuario.nome = dados["nome"].strip()

    if "perfil" in dados and dados["perfil"] is not None:
        perfil = dados["perfil"].strip().lower()
        if perfil not in ["dono", "funcionario"]:
            raise HTTPException(status_code=400, detail="Perfil inválido. Use 'dono' ou 'funcionario'.")
        usuario.perfil = perfil

    if "ativo" in dados:
        usuario.ativo = dados["ativo"]

    if "senha" in dados and dados["senha"]:
        usuario.senha_hash = gerar_hash_senha(dados["senha"])

    campos_permissoes = [
        "pode_vender",
        "pode_cadastrar_cliente",
        "pode_editar_cliente",
        "pode_ver_produtos",
        "pode_cadastrar_produto",
        "pode_editar_produto",
        "pode_alterar_estoque",
        "pode_abrir_caixa",
        "pode_fechar_caixa",
        "pode_fazer_sangria",
        "pode_fazer_suprimento",
        "pode_ver_relatorios",
        "pode_usar_orcamentos",
        "pode_excluir_registros",
        "pode_cadastrar_usuarios",
    ]

    for campo in campos_permissoes:
        if campo in dados:
            setattr(usuario, campo, dados[campo])

    if usuario.perfil == "dono":
        aplicar_permissoes_por_perfil(usuario)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/auth/login", response_model=schemas.LoginResponse)
def login(payload: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.usuario == payload.usuario.strip().lower()
    ).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos.")

    senha_hash = gerar_hash_senha(payload.senha)
    if usuario.senha_hash != senha_hash:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos.")

    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Usuário inativo.")

    return {
        "id": usuario.id,
        "nome": usuario.nome,
        "usuario": usuario.usuario,
        "perfil": usuario.perfil,
        "ativo": usuario.ativo,

        "pode_vender": usuario.pode_vender,
        "pode_cadastrar_cliente": usuario.pode_cadastrar_cliente,
        "pode_editar_cliente": usuario.pode_editar_cliente,
        "pode_ver_produtos": usuario.pode_ver_produtos,
        "pode_cadastrar_produto": usuario.pode_cadastrar_produto,
        "pode_editar_produto": usuario.pode_editar_produto,
        "pode_alterar_estoque": usuario.pode_alterar_estoque,
        "pode_abrir_caixa": usuario.pode_abrir_caixa,
        "pode_fechar_caixa": usuario.pode_fechar_caixa,
        "pode_fazer_sangria": usuario.pode_fazer_sangria,
        "pode_fazer_suprimento": usuario.pode_fazer_suprimento,
        "pode_ver_relatorios": usuario.pode_ver_relatorios,
        "pode_usar_orcamentos": usuario.pode_usar_orcamentos,
        "pode_excluir_registros": usuario.pode_excluir_registros,
        "pode_cadastrar_usuarios": usuario.pode_cadastrar_usuarios,
    }