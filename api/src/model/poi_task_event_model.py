from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.poi_task_model import PoiTaskModel


class PoiTaskEventModel(Base):
    __tablename__ = "poi_task_events"

    task_id: Mapped[UUID] = mapped_column(
        ForeignKey("poi_tasks.id", ondelete="RESTRICT"),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Relationship
    task: Mapped[PoiTaskModel] = relationship(back_populates="events")
