from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from secrets import SystemRandom, choice
from string import ascii_uppercase, digits
from typing import TYPE_CHECKING

from model.base.base import Base
from sqlalchemy import CheckConstraint, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.tour_poi_model import TourPoiModel


def generate_tour_code() -> str:
    characters = [
        choice(ascii_uppercase),
        choice(digits),
        *(choice(ascii_uppercase + digits) for _ in range(4)),
    ]
    SystemRandom().shuffle(characters)
    return "".join(characters)


class TourModel(Base):
    __tablename__ = "tours"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_tour_price_non_negative"),
        CheckConstraint("max_people > 0", name="ck_tour_max_people_positive"),
        CheckConstraint(
            "scanned_people >= 0 AND scanned_people <= max_people",
            name="ck_tour_scanned_people_range",
        ),
        CheckConstraint(
            "code ~ '^[A-Z0-9]{6}$' AND code ~ '[A-Z]' AND code ~ '[0-9]'",
            name="ck_tour_code_format",
        ),
    )

    code: Mapped[str] = mapped_column(
        String(6),
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
