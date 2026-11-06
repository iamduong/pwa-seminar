from enum import Enum

from bson import ObjectId
from schema.contract.base_contact import Base
from datetime import datetime


class MenuItemSubmissionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PROCESSING = "processing"


class MenuItemSubmissionModel(Base):
    owner_id: ObjectId
    poi_id: ObjectId
    name: str
    description: str | None = None
    price: float | None = None
    image_url: str | None = None
    status: MenuItemSubmissionStatus = MenuItemSubmissionStatus.PENDING
    admin_note: str | None = None
    reviewed_by: ObjectId | None = None
    reviewed_at: datetime | None = None
    menu_item_id: ObjectId | None = None
