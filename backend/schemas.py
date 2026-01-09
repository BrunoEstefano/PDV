from pydantic import BaseModel, ConfigDict
from typing import Optional


class ClienteCreate(BaseModel):
    nome: str
    cpf_cnpj: str
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None


class ClienteUpdate(BaseModel):
    # PATCH parcial: tudo opcional
    nome: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None


class ClienteOut(BaseModel):
    id: int
    nome: str
    cpf_cnpj: str
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)