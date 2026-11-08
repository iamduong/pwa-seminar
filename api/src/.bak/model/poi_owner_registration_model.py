from enum import Enum

from bson import ObjectId
from schema.contract.base_contact import Base


class PoiOwnerRegistrationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class PoiOwnerRegistrationModel(Base):
    user_id: ObjectId
    business_name: str
    business_address: str
    note: str
    admin_note: str
    status: PoiOwnerRegistrationStatus
