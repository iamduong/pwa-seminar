from sqlalchemy import Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from model.base.base import Base


class UiBundleModel(Base):
    __tablename__ = "ui_bundles"

    lang: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)
    ui_bundle: Mapped[dict[str, str]] = mapped_column(JSONB, nullable=False)
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )
