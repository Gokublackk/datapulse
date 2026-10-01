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


# Initialize Firebase Admin SDK
initialize_firebase()


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

        decoded_token = auth.verify_id_token(
            token
        )
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