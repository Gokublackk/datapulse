from sqlalchemy.orm import Session

from fastapi import Depends

from app.core.database import get_db

from app.core.auth import (
    get_current_user
)

from app.models.user import User



def get_database_user(

    firebase_user = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):


    firebase_uid = firebase_user["uid"]


    user = (

        db.query(User)

        .filter(
            User.firebase_uid == firebase_uid
        )

        .first()

    )


    if user:

        return user



    new_user = User(

        firebase_uid=firebase_uid,

        email=firebase_user.get(
            "email"
        ),

        full_name=firebase_user.get(
            "name",
            "User"
        )

    )
    if user:
        print("===== LOGGED IN USER =====")
        print("User ID:", user.id)
        print("Firebase UID:", user.firebase_uid)
        print("Email:", user.email)
        print("==========================")
        return user


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return new_user