from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.admin_user_model import AdminUserModel
    from model.menu_item_model import MenuItemModel
    from model.poi_model import PoiModel


class AnalyticsEventType(str, Enum):
    POI_VIEW = "poi_view"
    AUDIO_PLAY = "audio_play"
    MENU_ITEM_VIEW = "menu_item_view"
    HEARTBEAT = "heartbeat"


class AnalyticsEventModel(Base):
    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("ix_analytics_event_type_time", "event_type", "occurred_at"),
        Index("ix_analytics_poi_time", "poi_id", "occurred_at"),
        Index("ix_analytics_menu_item_time", "menu_item_id", "occurred_at"),
        Index("ix_analytics_session_time", "session_id", "occurred_at"),
    )

    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    session_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        nullable=False,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("admin_users.id", ondelete="RESTRICT"),
        nullable=True,
    )
    poi_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("pois.id", ondelete="RESTRICT"),
        nullable=True,
    )
    menu_item_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("menu_items.id", ondelete="RESTRICT"),
        nullable=True,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    event_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )

    user: Mapped[AdminUserModel | None] = relationship(
        back_populates="analytics_events",
    )
    poi: Mapped[PoiModel | None] = relationship(back_populates="analytics_events")
    menu_item: Mapped[MenuItemModel | None] = relationship(
        back_populates="analytics_events",
    )
