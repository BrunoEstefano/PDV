# backend/app.py
from fastapi import FastAPI

from backend.routers.auth import router as auth_router
from backend.routers.clientes import router as clientes_router

app = FastAPI(title="PDV API")

# ✅ NÃO coloque prefix aqui se o router já tem prefix
app.include_router(auth_router)
app.include_router(clientes_router)

@app.get("/")
def root():
    return {"status": "ok"}