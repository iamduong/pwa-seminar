from __future__ import annotations

from typing import TYPE_CHECKING

from model.base.base import Base
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.poi_model import PoiModel
    from model.poi_submission_model import PoiSubmissionModel


class PoiCategoryModel(Base):
    __tablename__ = "poi_categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship
    pois: Mapped[list[PoiModel]] = relationship(
        back_populates="category",
        passive_deletes="all",
    )

    poi_submissions: Mapped[list[PoiSubmissionModel]] = relationship(
        back_populates="category",
        passive_deletes="all",
    )
