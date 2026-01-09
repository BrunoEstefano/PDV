from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from .db import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)

    nome = Column(String(150), nullable=False)
    cpf_cnpj = Column(String(20), nullable=False, unique=True, index=True)

    telefone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)

    email = Column(String(150), nullable=True)
    endereco = Column(String(255), nullable=True)

    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )