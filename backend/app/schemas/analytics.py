from pydantic import BaseModel



class AnalyticsRequest(BaseModel):

    dataset_id: int
    group_column: str | None = None
    value_column: str | None = None
    operation: str | None = None
