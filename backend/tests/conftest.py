import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.db import Base
from backend.routers.clientes import get_db  # << importa o get_db REAL


# Banco SQLite em memória (mesmo banco para toda a suíte)
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Cria as tabelas 1x por sessão de testes
@pytest.fixture(scope="session", autouse=True)
def criar_tabelas():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# Sessão por teste, com transação + rollback
@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


# Client com override do get_db usando a sessão do teste
@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
