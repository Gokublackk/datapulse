from pydantic import BaseModel


class DashboardCreate(BaseModel):

    title: str

    description: str = ""


class DashboardUpdate(BaseModel):

    title: str

    description: str


class DashboardResponse(BaseModel):

    id: int

    title: str

    description: str

    class Config:

        from_attributes = True