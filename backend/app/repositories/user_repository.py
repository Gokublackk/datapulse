from sqlalchemy.orm import Session

from app.models.user import User


def create_user(
    db: Session,
    user: User
):

    db.add(user)

    db.commit()

    db.refresh(user)

    return user


def get_user_by_id(
    db: Session,
    user_id: int
):

    return (

        db.query(User)

        .filter(
            User.id == user_id
        )

        .first()

    )


def get_user_by_email(
    db: Session,
    email: str
):

    return (

        db.query(User)

        .filter(
            User.email == email
        )

        .first()

    )


def get_user_by_firebase_uid(
    db: Session,
    firebase_uid: str
):

    return (

        db.query(User)

        .filter(
            User.firebase_uid == firebase_uid
        )

        .first()

    )


def get_all_users(
    db: Session
):

    return (

        db.query(User)

        .all()

    )


def delete_user(
    db: Session,
    user: User
):

    db.delete(user)

    db.commit()