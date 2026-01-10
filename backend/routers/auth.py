from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from backend.utils.security import verify_password, create_access_token, get_password_hash

router = APIRouter(prefix="/auth", tags=["Auth"])

FAKE_USER = {
    "username": "admin",
    "role": "admin",
    "is_active": True,
    "hashed_password": get_password_hash("123456"),
}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != FAKE_USER["username"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário ou senha inválidos")

    if not verify_password(form_data.password, FAKE_USER["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário ou senha inválidos")

    access_token = create_access_token(
        data={"sub": FAKE_USER["username"], "role": FAKE_USER["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}