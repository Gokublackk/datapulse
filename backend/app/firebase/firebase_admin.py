from pathlib import Path
import os
import json
import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    if firebase_admin._apps:
        return

    base_dir = Path(__file__).resolve().parent
    service_account = base_dir / "serviceAccountKey.json"

    # Default storage bucket and project ID
    storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET", "datapulse-334ef.firebasestorage.app")
    project_id = os.getenv("FIREBASE_PROJECT_ID", "datapulse-334ef")

    # 1. Environment variable containing JSON credentials (recommended for cloud like Render)
    raw_creds = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON") or os.getenv("FIREBASE_CREDENTIALS")
    if raw_creds:
        try:
            cert_dict = json.loads(raw_creds)
            cred = credentials.Certificate(cert_dict)
            firebase_admin.initialize_app(cred, {
                "storageBucket": storage_bucket,
                "projectId": project_id,
            })
            print("[Firebase Admin] Initialized successfully from FIREBASE_SERVICE_ACCOUNT_JSON env.")
            return
        except Exception as e:
            print(f"[Firebase Admin] Failed loading from FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    # 2. File path from env or local default
    custom_path = os.getenv("FIREBASE_CREDENTIAL_PATH")
    cred_file = None
    if custom_path and Path(custom_path).exists():
        cred_file = Path(custom_path)
    elif service_account.exists():
        cred_file = service_account

    if cred_file and cred_file.exists():
        cred = credentials.Certificate(str(cred_file))
        firebase_admin.initialize_app(cred, {
            "storageBucket": storage_bucket,
            "projectId": project_id,
        })
        print(f"[Firebase Admin] Initialized with credentials file: {cred_file}")
    else:
        # Fallback default app with project id
        firebase_admin.initialize_app(options={
            "storageBucket": storage_bucket,
            "projectId": project_id,
        })
        print("[Firebase Admin] Initialized with default project fallback options.")