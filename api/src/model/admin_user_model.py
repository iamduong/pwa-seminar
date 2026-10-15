from datetime import datetime

from bson import ObjectId
from model._base import Base


class AdminUserModel(Base):
    full_name: str
    email: str
    phone: str
    password_hash: str

    is_active: bool
    is_poi_owner_verified: bool

    id_card_encrypted: str | None = None
    pii_collected_at: datetime | None = None

    role_id: ObjectId | None = None
