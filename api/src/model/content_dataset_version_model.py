from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from model.base.base import Base


class ContentDatasetVersionModel(Base):
    __tablename__ = "content_dataset_versions"

    key_query: Mapped[str] = mapped_column(String(200), nullable=False)
    etag: Mapped[str] = mapped_column(String(200), nullable=False)
