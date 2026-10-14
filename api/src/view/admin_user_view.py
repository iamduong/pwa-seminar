from datetime import datetime

from pydantic import BaseModel


class AdminUserView(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    is_active: bool
    is_poi_owner_verified: bool

    role_id: str | None
    role_name: str | None

    created_at: datetime
    updated_at: datetime
