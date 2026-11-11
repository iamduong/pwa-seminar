from datetime import datetime

from pydantic import BaseModel, Field


class FilterOwnerNotification(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class ViewOwnerNotification(BaseModel):
    id: str
    notification_type: str
    title: str
    message: str
    resource_type: str
    resource_id: str
    is_read: bool
    read_at: datetime | None
    created_at: datetime
