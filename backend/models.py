"""
Ronda ORM models — Rider and ShiftHistory tables.

Tables auto-create on server startup via main.py lifespan hook.
"""
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Rider(Base):
    __tablename__ = "riders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    baseline_average_rm: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    shifts: Mapped[list["ShiftHistory"]] = relationship(back_populates="rider")


class ShiftHistory(Base):
    __tablename__ = "shift_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rider_id: Mapped[int] = mapped_column(Integer, ForeignKey("riders.id"), nullable=False)
    date: Mapped[str] = mapped_column(String, nullable=False)
    recommended_app: Mapped[str] = mapped_column(String, default="")
    actual_earnings_rm: Mapped[float] = mapped_column(Float, default=0.0)
    weather_condition: Mapped[str] = mapped_column(String, default="")

    rider: Mapped["Rider"] = relationship(back_populates="shifts")