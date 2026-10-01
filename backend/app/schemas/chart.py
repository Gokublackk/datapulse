from typing import Optional

from pydantic import BaseModel


class ChartResponse(BaseModel):

    id: int

    dataset_id: int

    chart_type: str

    x_axis: Optional[str] = None

    y_axis: Optional[str] = None

    reason: str


class ChartDataRequest(BaseModel):

    chart_id: int