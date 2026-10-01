from pydantic import BaseModel


class DatasetResponse(BaseModel):

    id: int

    original_filename: str

    rows: int

    columns: int

    class Config:

        from_attributes = True