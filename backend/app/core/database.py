import os
import socket
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import (
    sessionmaker,
    DeclarativeBase
)

from app.core.config import settings

logger = logging.getLogger("datapulse")


def is_port_open(host="127.0.0.1", port=5432) -> bool:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.1)
        result = s.connect_ex((host, port))
        s.close()
        return result == 0
    except Exception:
        return False



def create_resilient_engine():
    database_url = settings.DATABASE_URL
    if database_url and database_url.startswith("postgresql"):
        # Quickly check if postgres port is open
        if is_port_open("localhost", 5432):
            try:
                test_engine = create_engine(database_url)
                with test_engine.connect():
                    pass
                logger.info("Connected to PostgreSQL successfully.")
                return test_engine
            except Exception as exc:
                logger.warning(f"PostgreSQL connection failed ({exc}). Using SQLite.")
        else:
            logger.info("PostgreSQL port 5432 is not running. Using local SQLite.")
    
    # Fallback SQLite database (always store in backend root so all processes share the same DB)
    from pathlib import Path
    db_file = Path(__file__).resolve().parents[2] / "datapulse.db"
    sqlite_url = f"sqlite:///{db_file.as_posix()}"
    return create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )




engine = create_resilient_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()