import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent

RENDER_DISK_PATH = os.getenv("RENDER_DISK_PATH")

if RENDER_DISK_PATH:
    DB_PATH = Path(RENDER_DISK_PATH) / "pdv.db"
else:
    DB_PATH = BASE_DIR / "pdv.db"

DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()