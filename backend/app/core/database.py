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
    if database_url:
        # Render and other cloud providers give postgres://, which SQLAlchemy 2.0 requires as postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)

        is_local = "localhost" in database_url or "127.0.0.1" in database_url
        if is_local:
            # If on Render or cloud where local postgres is not running, NEVER hang connecting to localhost
            if not is_port_open("127.0.0.1", 5432):
                logger.info("Local PostgreSQL port is not running. Using local SQLite.")
                from pathlib import Path
                db_file = Path(__file__).resolve().parents[2] / "datapulse.db"
                sqlite_url = f"sqlite:///{db_file.as_posix()}"
                return create_engine(
                    sqlite_url,
                    connect_args={"check_same_thread": False}
                )

        if database_url.startswith("postgresql"):
            try:
                test_engine = create_engine(
                    database_url,
                    pool_pre_ping=True,
                    connect_args={"connect_timeout": 3}
                )
                with test_engine.connect():
                    pass
                logger.info("Connected to PostgreSQL successfully.")
                return test_engine
            except Exception as exc:
                logger.warning(f"PostgreSQL connection failed ({exc}). Using SQLite.")
        else:
            try:
                test_engine = create_engine(database_url)
                with test_engine.connect():
                    pass
                return test_engine
            except Exception as exc:
                logger.warning(f"Database connection failed ({exc}). Using SQLite.")
    
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