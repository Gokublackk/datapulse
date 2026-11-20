import os
import logging
from fastapi import (
    Depends,
    HTTPException
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from firebase_admin import auth

from app.firebase.firebase_admin import (
    initialize_firebase
)
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

logger = logging.getLogger("datapulse")

# Initialize Firebase Admin SDK
initialize_firebase()

_google_auth_request = google_requests.Request()

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    )
):

    try:
        token = credentials.credentials

        # Support development / demo studio mode
        if token.startswith("demo-") or token in ("demo-token", "guest-token"):
            return {
                "uid": "datapulse_demo_user",
                "email": "demo@datapulse.io",
                "name": "Demo Explorer",
                "picture": None
            }

        # 1. Try Firebase Admin SDK verification (works if service account is loaded)
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as admin_exc:
            logger.debug(f"Admin SDK verification unavailable ({admin_exc}). Trying Google public key verification.")

        # 2. Resilient fallback: verify using Google's public JWK certificates (zero service account required)
        project_id = os.getenv("FIREBASE_PROJECT_ID", "datapulse-334ef")
        decoded_token = google_id_token.verify_firebase_token(
            token,
            _google_auth_request,
            audience=project_id
        )

        if not decoded_token:
            raise ValueError("Token verification returned empty payload")

        # Normalize uid so all routes/dependencies find it reliably
        if "uid" not in decoded_token:
            decoded_token["uid"] = decoded_token.get("user_id") or decoded_token.get("sub")

        return decoded_token

    except Exception as exc:

        print(
            "🔥 FIREBASE AUTH ERROR:",
            repr(exc)
        )

        raise HTTPException(

            status_code=401,

            detail="Invalid Firebase token"

        )