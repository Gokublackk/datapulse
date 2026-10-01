from datetime import datetime

from sqlalchemy import (
    Integer,
    String,
    DateTime,
    ForeignKey,
    JSON
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from app.core.database import Base


class Chart(Base):

    __tablename__ = "charts"


    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )


    dashboard_id: Mapped[int] = mapped_column(
        ForeignKey("dashboards.id"),
        nullable=False
    )


    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id"),
        nullable=False
    )


    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )


    chart_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )


    x_axis: Mapped[str] = mapped_column(
        String(100),
        nullable=True
    )


    y_axis: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )


    reason: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    score: Mapped[int] = mapped_column(
    Integer,
    default=0,
    nullable=False
)


    configuration: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )


    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


    dashboard = relationship(
        "Dashboard",
        back_populates="charts"
    )


    dataset = relationship(
        "Dataset",
        back_populates="charts"
    )