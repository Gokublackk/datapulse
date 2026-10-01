from fastapi import APIRouter

from fastapi import Depends

from app.models.user import User

from app.schemas.user import UserResponse

from app.dependencies.user_dependency import (
    get_database_user
)


router = APIRouter(

    prefix="/auth",

    tags=["Authentication"]

)


@router.get(

    "/me",

    response_model=UserResponse

)
def get_me(

    user: User = Depends(

        get_database_user

    )

):

    """Verify the caller's Firebase token and return their DataPulse user row.

    The dependency creates the row on first sign-in, so a fresh Google account
    is registered by simply calling this endpoint.
    """

    return user
