from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.menu_item_model import MenuItemModel


class MenuItemTranslationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class MenuItemLocalizationModel(Base):
    __tablename__ = "menu_item_localizations"
    __table_args__ = (
        UniqueConstraint(
            "menu_item_id",
            "lang",
            name="uq_menu_item_localization_language",
        ),
    )

    menu_item_id: Mapped[UUID] = mapped_column(
        ForeignKey("menu_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    lang: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    translation_status: Mapped[str] = mapped_column(
        String(30),
        default=MenuItemTranslationStatus.PENDING.value,
        nullable=False,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    menu_item: Mapped[MenuItemModel] = relationship(back_populates="localizations")
