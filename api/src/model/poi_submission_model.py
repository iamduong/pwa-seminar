from datetime import datetime
from enum import Enum

from bson import ObjectId
from model._base import Base
from model.poi_model import GeoPointModel


class PoiSubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PoiSubmissionModel(Base):
    owner_id: ObjectId
    poi_id: ObjectId | None = None

    category_id: ObjectId
    name: str
    description: str
    address: str
    location: GeoPointModel
    images: list[str]
    trigger_radius: int = 30
    owner_note: str

    status: PoiSubmissionStatus = PoiSubmissionStatus.PENDING
    admin_note: str | None = None
    reviewed_by: ObjectId | None = None
    reviewed_at: datetime | None = None
