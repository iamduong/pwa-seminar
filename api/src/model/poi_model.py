from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from geoalchemy2 import Geography
from geoalchemy2.elements import WKBElement
from model.base.base import Base
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.admin_user_model import AdminUserModel
    from model.menu_item_model import MenuItemModel
    from model.poi_category_model import PoiCategoryModel
    from model.poi_localization_model import PoiLocalizationModel
    from model.poi_submission_model import PoiSubmissionModel
    from model.poi_task_model import PoiTaskModel


class AudioStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class PoiModel(Base):
    __tablename__ = "pois"

    owner_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("admin_users.id", ondelete="SET NULL"),
        nullable=True,
    )
    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("poi_categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    category_name: Mapped[str] = mapped_column(String(150), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[WKBElement] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    images: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        default=list,
        nullable=False,
    )
    trigger_radius: Mapped[float] = mapped_column(Float, default=30, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    activation_requested: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    audio_priority: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    audio_status: Mapped[str] = mapped_column(
        String(30),
        default=AudioStatus.PENDING.value,
        nullable=False,
    )

    # Relationship
    owner: Mapped[AdminUserModel | None] = relationship(back_populates="pois")

    category: Mapped[PoiCategoryModel] = relationship(back_populates="pois")

    menu_items: Mapped[list[MenuItemModel]] = relationship(
        back_populates="poi",
        cascade="all, delete-orphan",
    )

    localizations: Mapped[list[PoiLocalizationModel]] = relationship(
        back_populates="poi",
        cascade="all, delete-orphan",
    )

    tasks: Mapped[list[PoiTaskModel]] = relationship(
        back_populates="poi",
        cascade="all, delete-orphan",
    )

    submissions: Mapped[list[PoiSubmissionModel]] = relationship(back_populates="poi")
