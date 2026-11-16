from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.poi_model import PoiModel
    from model.tour_model import TourModel


class TourPoiModel(Base):
    __tablename__ = "tour_pois"
    __table_args__ = (
        UniqueConstraint("tour_id", "poi_id", name="uq_tour_poi"),
        Index("ix_tour_poi_poi_tour", "poi_id", "tour_id"),
    )

    tour_id: Mapped[UUID] = mapped_column(
        ForeignKey("tours.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    poi_id: Mapped[UUID] = mapped_column(
        ForeignKey("pois.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    tour: Mapped[TourModel] = relationship(back_populates="poi_links")
    poi: Mapped[PoiModel] = relationship(back_populates="tour_links")
