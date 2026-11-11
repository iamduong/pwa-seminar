from datetime import datetime

from pydantic import BaseModel, Field


class FilterAuditLog(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    actor_user_id: str | None = None
    action: str | None = None
    resource_type: str | None = None


class ViewAuditLog(BaseModel):
    id: str
    actor_user_id: str | None
    action: str
    resource_type: str
    resource_id: str | None
    result: str
    description: str | None
    metadata: dict
    created_at: datetime
