from fastapi import FastAPI
from backend.routers import auth, clientes

def create_app():
    app = FastAPI(title="PDV / BNTECH", version="1.0.0")
    app.include_router(auth.router)
    app.include_router(clientes.router)

    @app.get("/")
    def home():
        return {"status": "ok"}

    return app

app = create_app()
