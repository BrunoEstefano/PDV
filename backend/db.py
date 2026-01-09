from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./pdv.sqlite"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # necessário no SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()