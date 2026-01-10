# backend/utils/security.py

from datetime import datetime, timedelta
from typing import Callable, Optional,Generator
import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.db import SessionLocal
from backend import models


# =========================
# CONFIG JWT (PROFISSIONAL)
# =========================
# Em produção use variável de ambiente:
#   setx SECRET_KEY "uma-chave-bem-grande..."
SECRET_KEY = os.getenv("SECRET_KEY", "TROQUE_ISTO_POR_UMA_CHAVE_FORTE_E_LONGA_32+")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# IMPORTANTE:
# Para o Swagger/OpenAPI, normalmente é melhor SEM barra inicial:
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# >>> AQUI ESTÁ O FIX PRINCIPAL <<<
# Argon2 não tem a limitação de 72 bytes do bcrypt.
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# =========================
# DB DEPENDENCY
# =========================
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# PASSWORD HELPERS
# =========================
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# =========================
# TOKEN HELPERS
# =========================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


# =========================
# CURRENT USER
# =========================
def get_current_user(
    token: str = Depends(oauth2_scheme),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        role: str | None = payload.get("role")

        if not username:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # USUÁRIO MOCK (mesmo do auth.py)
    if username == "admin":
        return {
            "username": "admin",
            "role": role or "admin",
            "is_active": True,
        }

    raise credentials_exception

    if getattr(user, "is_active", True) is False:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User inactive")

    return user


# =========================
# ROLES
# =========================
def get_user_role(user: models.User) -> str:
    # Exemplo simples (profissionalizável):
    # Depois você coloca uma coluna role na tabela users.
    if user.username == "admin":
        return "admin"
    return "user"


def require_roles(*roles: str) -> Callable:
    def checker(current_user: models.User = Depends(get_current_user)) -> models.User:
        current_role = get_user_role(current_user)
        if current_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return current_user

    return checker


require_admin = require_roles("admin")
require_user_or_admin = require_roles("user", "admin")