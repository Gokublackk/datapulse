from datetime import datetime

from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Dashboard(Base):

    __tablename__ = "dashboards"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text,
        default=""
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="dashboards"
    )

    datasets = relationship(
        "Dataset",
        back_populates="dashboard",
        cascade="all, delete-orphan"
    )
    charts = relationship(
        "Chart",
        back_populates="dashboard",
        cascade="all, delete-orphan"
    )