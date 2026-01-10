from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from backend import models, schemas
from backend.db import SessionLocal
from backend.utils.security import get_current_user  # ✅ IMPORTANTE

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)]  # ✅ trava todas as rotas /clientes
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=list[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(models.Cliente).all()


@router.post("/", response_model=schemas.ClienteOut, status_code=status.HTTP_201_CREATED)
def criar_cliente(dados: schemas.ClienteCreate, db: Session = Depends(get_db)):
    try:
        novo = models.Cliente(**dados.model_dump())
        db.add(novo)
        db.commit()
        db.refresh(novo)
        return novo
   
    except IntegrityError:db.rollback()
    raise HTTPException(
        status_code=400,
        detail="CPF/CNPJ já cadastrado"
    )


@router.patch("/{cliente_id}", response_model=schemas.ClienteOut)
def atualizar_cliente_parcial(
    cliente_id: int,
    dados: schemas.ClienteUpdate,
    db: Session = Depends(get_db),
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    for k, v in dados.model_dump(exclude_unset=True).items():
        setattr(cliente, k, v)

    try:
        db.commit()
        db.refresh(cliente)
        return cliente
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro no banco de dados: {str(e)}")


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    try:
        db.delete(cliente)
        db.commit()
        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro no banco de dados: {str(e)}")