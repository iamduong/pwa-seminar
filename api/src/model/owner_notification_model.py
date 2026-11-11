from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID

from model.base.base import Base
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.admin_user_model import AdminUserModel


class OwnerNotificationType(str, Enum):
    OWNER_REGISTRATION_SUBMITTED = "owner_registration_submitted"
    OWNER_REGISTRATION_REVIEWED = "owner_registration_reviewed"
    POI_SUBMISSION_SUBMITTED = "poi_submission_submitted"
    POI_SUBMISSION_REVIEWED = "poi_submission_reviewed"
    POI_PROCESSING_COMPLETED = "poi_processing_completed"


class OwnerNotificationModel(Base):
    __tablename__ = "owner_notifications"
    __table_args__ = (
        UniqueConstraint(
            "owner_id",
            "notification_type",
            "resource_id",
            name="uq_owner_notification_resource",
        ),
        Index("ix_owner_notification_owner_read", "owner_id", "is_read"),
    )

    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("admin_users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    notification_type: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(60), nullable=False)
    resource_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        nullable=False,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped[AdminUserModel] = relationship(back_populates="owner_notifications")
