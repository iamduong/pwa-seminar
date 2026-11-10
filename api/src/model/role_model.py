from __future__ import annotations

from typing import TYPE_CHECKING

from model.base.base import Base
from sqlalchemy import Boolean, Integer, String, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from model.admin_user_model import AdminUserModel


class RoleModel(Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    permissions: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default=text("'{}'::text[]"),
    )
    is_system: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )
    priority: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=10,
        server_default=text("10"),
    )

    # Relationship
    users: Mapped[list[AdminUserModel]] = relationship(
        back_populates="role",
        passive_deletes="all",
    )
