from pathlib import Path
import os
import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    if firebase_admin._apps:
        return

    base_dir = Path(__file__).resolve().parent
    service_account = base_dir / "serviceAccountKey.json"

    # Default storage bucket from frontend .env or config
    storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET", "datapulse-334ef.firebasestorage.app")

    if service_account.exists():
        cred = credentials.Certificate(str(service_account))
        firebase_admin.initialize_app(cred, {
            "storageBucket": storage_bucket
        })
    else:
        # Fallback default app
        firebase_admin.initialize_app(options={
            "storageBucket": storage_bucket
        })