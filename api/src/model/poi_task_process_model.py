from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.poi_task_model import PoiTaskModel


class ProcessStatus(str, Enum):
    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"


class PoiTaskProcessModel(Base):
    __tablename__ = "poi_task_processes"

    task_id: Mapped[UUID] = mapped_column(
        ForeignKey("poi_tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    language: Mapped[str] = mapped_column(String(10), nullable=False)
    translation_status: Mapped[str] = mapped_column(
        String(30),
        default=ProcessStatus.PENDING.value,
        nullable=False,
    )
    audio_status: Mapped[str] = mapped_column(
        String(30),
        default=ProcessStatus.PENDING.value,
        nullable=False,
    )
    audio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationship
    task: Mapped[PoiTaskModel] = relationship(back_populates="processes")
