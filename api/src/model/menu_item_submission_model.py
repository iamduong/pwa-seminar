from enum import Enum

from bson import ObjectId
from schema.contract.base_contact import Base


class MenuItemSubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MenuItemSubmissionModel(Base):
    owner_id: ObjectId
    poi_id: ObjectId
    name: str
    description: str | None = None
    price: float | None = None
    image_url: str | None = None
    status: MenuItemSubmissionStatus = MenuItemSubmissionStatus.PENDING
    admin_note: str | None = None
