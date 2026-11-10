from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from model.poi_task_event_model import PoiTaskEventModel
from model.poi_task_process_model import PoiTaskProcessModel
from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.poi_model import PoiModel


class PoiTaskType(str, Enum):
    CREATE = "create"
    UPDATE = "update"


class PoiTaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    FAILED = "failed"
    DONE = "done"


class PoiTaskModel(Base):
    __tablename__ = "poi_tasks"

    poi_id: Mapped[UUID] = mapped_column(
        ForeignKey("pois.id", ondelete="RESTRICT"),
        nullable=False,
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        default=PoiTaskStatus.QUEUED.value,
        nullable=False,
    )
    progress_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    target_languages: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        nullable=False,
    )
    step_language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    activation_requested: Mapped[bool] = mapped_column(Boolean, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # Relationship
    poi: Mapped[PoiModel] = relationship(back_populates="tasks")

    events: Mapped[list[PoiTaskEventModel]] = relationship(
        back_populates="task",
        passive_deletes="all",
    )

    processes: Mapped[list[PoiTaskProcessModel]] = relationship(
        back_populates="task",
        passive_deletes="all",
    )


# Keep the old import names while the services are migrated.
Event = PoiTaskEventModel
Process = PoiTaskProcessModel
