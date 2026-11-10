from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.poi_model import PoiModel


class AudioStatus(str, Enum):
    PENDING = "pending"
    READY = "ready"
    PROCESSING = "processing"
    FAILED = "failed"


class PoiLocalizationModel(Base):
    __tablename__ = "poi_localizations"

    poi_id: Mapped[UUID] = mapped_column(
        ForeignKey("pois.id", ondelete="RESTRICT"),
        nullable=False,
    )
    lang: Mapped[str] = mapped_column(String(10), nullable=False)
    category: Mapped[str] = mapped_column(String(150), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    audio_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_status: Mapped[str] = mapped_column(
        String(30),
        default=AudioStatus.PENDING.value,
        nullable=False,
    )

    # Relationship
    poi: Mapped[PoiModel] = relationship(back_populates="localizations")
