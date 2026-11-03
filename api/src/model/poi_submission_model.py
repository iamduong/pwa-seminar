from enum import Enum

from bson import ObjectId
from model.poi_model import GeoPointModel
from schema.contract.base_contact import Base


class PoiSubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PoiSubmissionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"


class PoiSubmissionModel(Base):
    owner_id: ObjectId

    poi_id: ObjectId | None = None
    submission_type: PoiSubmissionType = PoiSubmissionType.CREATE

    category_id: ObjectId
    category_name: str

    name: str
    description: str
    address: str
    location: GeoPointModel

    images: list[str]
    owner_note: str

    status: PoiSubmissionStatus = PoiSubmissionStatus.PENDING
    admin_note: str | None = None
