from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from geoalchemy2 import Geography
from geoalchemy2.elements import WKBElement
from model.base.base import Base
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.admin_user_model import AdminUserModel
    from model.poi_category_model import PoiCategoryModel
    from model.poi_model import PoiModel


class PoiSubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PoiSubmissionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"


class PoiSubmissionModel(Base):
    __tablename__ = "poi_submissions"

    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("admin_users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    poi_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("pois.id", ondelete="SET NULL"),
        nullable=True,
    )
    submission_type: Mapped[str] = mapped_column(
        String(30),
        default=PoiSubmissionType.CREATE.value,
        nullable=False,
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
    trigger_radius: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    owner_note: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30),
        default=PoiSubmissionStatus.PENDING.value,
        nullable=False,
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationship
    owner: Mapped[AdminUserModel] = relationship(back_populates="poi_submissions")

    poi: Mapped[PoiModel | None] = relationship(back_populates="submissions")

    category: Mapped[PoiCategoryModel] = relationship(back_populates="poi_submissions")
