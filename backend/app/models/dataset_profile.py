from sqlalchemy import (
    Integer,
    ForeignKey
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.core.database import Base


class DatasetProfile(Base):

    __tablename__ = "dataset_profiles"


    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )


    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id"),
        unique=True,
        nullable=False
    )


    total_rows: Mapped[int] = mapped_column(
        Integer
    )


    total_columns: Mapped[int] = mapped_column(
        Integer
    )


    missing_values: Mapped[int] = mapped_column(
        Integer,
        default=0
    )


    duplicate_rows: Mapped[int] = mapped_column(
        Integer,
        default=0
    )


    dataset = relationship(
        "Dataset",
        back_populates="profile"
    )