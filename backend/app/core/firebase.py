from pathlib import Path

import firebase_admin  # type: ignore
from firebase_admin import credentials  # type: ignore


BASE_DIR = Path(__file__).resolve().parent.parent.parent


SERVICE_ACCOUNT_FILE = BASE_DIR / "firebase-service-account.json"


if not SERVICE_ACCOUNT_FILE.exists():
    raise FileNotFoundError(
        f"Firebase service account not found: {SERVICE_ACCOUNT_FILE}"
    )


if not firebase_admin._apps:

    cred = credentials.Certificate(
        str(SERVICE_ACCOUNT_FILE)
    )

    firebase_admin.initialize_app(
        cred
    )