from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import uuid4

from model.base.base import Base
from sqlalchemy import CheckConstraint, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.tour_poi_model import TourPoiModel


def generate_tour_code() -> str:
    return f"TOUR-{uuid4().hex[:12].upper()}"


class TourModel(Base):
    __tablename__ = "tours"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_tour_price_non_negative"),
        CheckConstraint("max_people > 0", name="ck_tour_max_people_positive"),
        CheckConstraint(
            "scanned_people >= 0 AND scanned_people <= max_people",
            name="ck_tour_scanned_people_range",
        ),
    )

    code: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        unique=True,
        index=True,
        default=generate_tour_code,
    )
    price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    max_people: Mapped[int] = mapped_column(Integer, nullable=False)
    scanned_people: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    poi_links: Mapped[list[TourPoiModel]] = relationship(
        back_populates="tour",
        passive_deletes="all",
    )
