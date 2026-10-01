from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate

from app.repositories.user_repository import (
    create_user,
    get_user_by_email,
    get_user_by_firebase_uid
)


def register_user(
    db: Session,
    data: UserCreate
):

    existing = get_user_by_firebase_uid(
        db,
        data.firebase_uid
    )

    if existing:
        return existing

    user = User(

        firebase_uid=data.firebase_uid,

        email=data.email,

        full_name=data.full_name

    )

    return create_user(
        db,
        user
    )


def login_user(
    db: Session,
    firebase_uid: str
):

    return get_user_by_firebase_uid(
        db,
        firebase_uid
    )