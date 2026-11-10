from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from model.base.base import Base

if TYPE_CHECKING:
    from model.analytics_event_model import AnalyticsEventModel
    from model.menu_item_localization_model import MenuItemLocalizationModel
    from model.poi_model import PoiModel


class MenuItemModel(Base):
    __tablename__ = "menu_items"

    poi_id: Mapped[UUID] = mapped_column(
        ForeignKey("pois.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship
    poi: Mapped[PoiModel] = relationship(back_populates="menu_items")

    localizations: Mapped[list[MenuItemLocalizationModel]] = relationship(
        back_populates="menu_item",
        passive_deletes="all",
    )

    analytics_events: Mapped[list[AnalyticsEventModel]] = relationship(
        back_populates="menu_item",
        passive_deletes="all",
    )
