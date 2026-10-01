from typing import Any
from pydantic import BaseModel, Field


class PreprocessRequest(BaseModel):
    action: str = Field(..., description="Action name: drop_duplicates, drop_na, fill_na, drop_columns, rename_columns, convert_type, filter_outliers, normalize")
    columns: list[str] = Field(default_factory=list)
    strategy: str | None = None
    fill_value: Any | None = None
    target_type: str | None = None
    rename_mapping: dict[str, str] | None = None
    factor: float = 1.5
