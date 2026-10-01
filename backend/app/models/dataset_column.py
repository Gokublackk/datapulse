from sqlalchemy import (
    String,
    Integer,
    Boolean,
    ForeignKey
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.core.database import Base


class DatasetColumn(Base):

    __tablename__ = "dataset_columns"


    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )


    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id"),
        nullable=False
    )


    column_name: Mapped[str] = mapped_column(
        String(150)
    )


    data_type: Mapped[str] = mapped_column(
        String(50)
    )


    is_numeric: Mapped[bool] = mapped_column(
        Boolean
    )


    is_categorical: Mapped[bool] = mapped_column(
        Boolean
    )


    dataset = relationship(
        "Dataset",
        back_populates="dataset_columns"
    )