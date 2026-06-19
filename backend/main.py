from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from hashlib import sha256

from backend.db import Base, engine, SessionLocal
from backend import models

from backend.routers import usuarios, clientes, produtos, caixa, relatorios, orcamentos, vendas

app = FastAPI(title="BNtech PDV")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def gerar_hash_senha(senha: str) -> str:
    return sha256(senha.encode("utf-8")).hexdigest()


def criar_admin_inicial():
    db: Session = SessionLocal()
    try:
        usuario_existente = db.query(models.Usuario).first()

        if usuario_existente:
            print("Já existe usuário cadastrado no sistema.")
            return

        admin = models.Usuario(
            nome="Administrador",
            usuario="admin",
            senha_hash=gerar_hash_senha("1234"),
            perfil="dono",
            ativo=True,

            pode_vender=True,
            pode_cadastrar_cliente=True,
            pode_editar_cliente=True,
            pode_ver_produtos=True,
            pode_cadastrar_produto=True,
            pode_editar_produto=True,
            pode_alterar_estoque=True,
            pode_abrir_caixa=True,
            pode_fechar_caixa=True,
            pode_fazer_sangria=True,
            pode_fazer_suprimento=True,
            pode_ver_relatorios=True,
            pode_usar_orcamentos=True,
            pode_excluir_registros=True,
            pode_cadastrar_usuarios=True
        )

        db.add(admin)
        db.commit()

        print("Usuário administrador inicial criado com sucesso.")
        print("Login: admin")
        print("Senha: 1234")

    except Exception as e:
        db.rollback()
        print(f"Erro ao criar usuário administrador inicial: {e}")
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    criar_admin_inicial()


@app.get("/")
def raiz():
    return {"mensagem": "API BNtech funcionando com sucesso."}


app.include_router(usuarios.router)
app.include_router(clientes.router)
app.include_router(produtos.router)
app.include_router(caixa.router)
app.include_router(relatorios.router)
app.include_router(orcamentos.router)
app.include_router(vendas.router)