from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):

    firebase_uid: str

    email: EmailStr

    full_name: str


class UserResponse(UserCreate):

    id: int

    class Config:

        from_attributes = True