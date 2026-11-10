from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import CheckConstraint, Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.admin_user_model import AdminUserModel


class AiUsageLimitModel(Base):
    __tablename__ = "ai_usage_limits"
    __table_args__ = (
        UniqueConstraint("user_id", "usage_date", name="uq_ai_usage_user_date"),
        CheckConstraint("usage_count >= 0", name="ck_ai_usage_count_non_negative"),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("admin_users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    usage_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped[AdminUserModel] = relationship(back_populates="ai_usage_limits")
