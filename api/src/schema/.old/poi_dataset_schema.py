from datetime import datetime

from model.poi_model import AudioStatus, GeoPointModel
from pydantic import BaseModel


class PoiDatasetItem(BaseModel):
    id: str
    category_id: str
    category_name: str
    name: str
    description: str
    address: str
    location: GeoPointModel
    images: list[str]
    trigger_radius: float
    audio_priority: int
    audio_status: AudioStatus
    audio_url: str | None
    lang: str
    created_at: datetime
    updated_at: datetime


class PoiDataset(BaseModel):
    etag: str
    updated_after: datetime | None
    pois: list[PoiDatasetItem]
