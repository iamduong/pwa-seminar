from datetime import datetime

from model.poi_model import AudioStatus
from pydantic import BaseModel, Field
from schema.geo_schema import GeoPoint


class FilterOwnerPoi(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)


class ViewOwnerPoi(BaseModel):
    id: str
    category_id: str
    category_name: str
    name: str
    description: str
    address: str
    location: GeoPoint
    images: list[str]
    trigger_radius: float
    is_active: bool
    activation_requested: bool
    audio_priority: int
    audio_status: AudioStatus
    created_at: datetime
    updated_at: datetime
