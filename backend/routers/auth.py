from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import User, Empresa
from backend.schemas import UserCreate
from backend.security import verify_password, create_access_token, get_password_hash

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    existe_user = db.query(User).filter(User.email == payload.email).first()
    if existe_user:
        raise HTTPException(
            status_code=400,
            detail="Já existe um usuário com esse email."
        )

    empresa = db.query(Empresa).filter(Empresa.id == payload.empresa_id).first()
    if not empresa:
        raise HTTPException(
            status_code=404,
            detail="Empresa não encontrada."
        )

    novo_user = User(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        empresa_id=payload.empresa_id,
    )

    db.add(novo_user)
    db.commit()
    db.refresh(novo_user)

    return {
        "message": "Usuário criado com sucesso.",
        "id": str(novo_user.id),
        "email": novo_user.email,
        "empresa_id": str(novo_user.empresa_id),
        "role": novo_user.role,
    }


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
    }