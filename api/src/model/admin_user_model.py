from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.ai_usage_limit_model import AiUsageLimitModel
    from model.analytics_event_model import AnalyticsEventModel
    from model.poi_model import PoiModel
    from model.poi_owner_registration_model import PoiOwnerRegistrationModel
    from model.poi_submission_model import PoiSubmissionModel
    from model.role_model import RoleModel


class AdminUserModel(Base):
    __tablename__ = "admin_users"

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_poi_owner_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    id_card_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    pii_collected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    role_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("roles.id", ondelete="RESTRICT"),
        nullable=True,
    )

    # Relationship
    role: Mapped[RoleModel | None] = relationship(back_populates="users")

    pois: Mapped[list[PoiModel]] = relationship(
        back_populates="owner",
        passive_deletes="all",
    )

    poi_submissions: Mapped[list[PoiSubmissionModel]] = relationship(
        back_populates="owner",
        passive_deletes="all",
    )

    poi_owner_registrations: Mapped[list[PoiOwnerRegistrationModel]] = relationship(
        back_populates="owner",
        passive_deletes="all",
    )

    ai_usage_limits: Mapped[list[AiUsageLimitModel]] = relationship(
        back_populates="user",
        passive_deletes="all",
    )

    analytics_events: Mapped[list[AnalyticsEventModel]] = relationship(
        back_populates="user",
        passive_deletes="all",
    )
