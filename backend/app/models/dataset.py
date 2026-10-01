from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    DateTime
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.core.database import Base
from typing import List


class Dataset(Base):

    __tablename__ = "datasets"


    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )


    dashboard_id: Mapped[int] = mapped_column(
        ForeignKey("dashboards.id"),
        nullable=False
    )


    name: Mapped[str] = mapped_column(
        String(150),
        nullable=True
    )


    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )


    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )


    file_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )


    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )


    rows: Mapped[int] = mapped_column(
        Integer,
        default=0
    )


    columns: Mapped[int] = mapped_column(
        Integer,
        default=0
    )


    firebase_storage_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )


    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


    @property
    def uploaded_at(self) -> datetime:
        return self.created_at


    dashboard = relationship(
        "Dashboard",
        back_populates="datasets"
    )


    dataset_columns = relationship(
        "DatasetColumn",
        back_populates="dataset",
        cascade="all, delete-orphan"
    )


    profile = relationship(
        "DatasetProfile",
        back_populates="dataset",
        uselist=False,
        cascade="all, delete-orphan"
    )
    charts = relationship(

        "Chart",

        back_populates="dataset",
        cascade="all,delete-orphan"

    )