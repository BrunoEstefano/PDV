from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.db import SessionLocal
from backend import models, schemas

router = APIRouter(prefix="/clientes", tags=["Clientes"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).all()
    return clientes

@router.post("/", response_model=schemas.ClienteOut, status_code=201)
def criar_cliente(dados: schemas.ClienteCreate, db: Session = Depends(get_db)):
    novo = models.Cliente(**dados.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@router.patch("/{cliente_id}", response_model=schemas.ClienteOut)
def atualizar_cliente_parcial(cliente_id: int, dados: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    for k, v in dados.model_dump(exclude_unset=True).items():
        setattr(cliente, k, v)

    db.commit()
    db.refresh(cliente)
    return cliente

@router.delete("/{cliente_id}", status_code=204)
def deletar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db.delete(cliente)
    db.commit()
    return None