from fastapi import FastAPI
from backend.db import Base, engine
from backend.routers import clientes

def create_app():
    app = FastAPI(title="PDV / BNTECH", version="1.0.0")

    Base.metadata.create_all(bind=engine)

    app.include_router(clientes.router)

    @app.get("/")
    def home():
        return {"status": "ok"}

    return app
