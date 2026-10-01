from pathlib import Path
from pydantic_settings import BaseSettings

_BASE_DIR = Path(__file__).resolve().parents[2]
_ENV_FILE = _BASE_DIR / ".env"


class Settings(BaseSettings):

    PROJECT_NAME: str = "DataPulse"

    DATABASE_URL: str = "postgresql://postgres:5361@localhost:5432/datapulse"

    FRONTEND_URL: str = "http://localhost:5173"

    FIREBASE_CREDENTIAL_PATH: str = "firebase-service-account.json"

    UPLOAD_DIRECTORY: str = "uploads"

    MAX_UPLOAD_SIZE_MB: int = 50


    class Config:

        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else ".env"
        extra = "ignore"



settings = Settings()