from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.schemas.user import (
    UserCreate,
    UserResponse
)

from app.services.user_service import (
    register_user
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post(
    "/register",
    response_model=UserResponse
)
def create_user(

    data: UserCreate,

    db: Session = Depends(get_db)

):

    return register_user(
        db,
        data
    )