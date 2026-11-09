from datetime import datetime

from model.poi_model import AudioStatus
from pydantic import BaseModel, Field
from schema.geo_schema import GeoPoint


class FilterOwnerPoi(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)


class CreateAdminPoi(BaseModel):
    category_id: str
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    address: str = Field(min_length=5, max_length=500)
    location: GeoPoint
    images: list[str] = Field(default_factory=list, max_length=10)
    trigger_radius: float = Field(default=30, ge=10, le=500)
    audio_priority: int = Field(default=100, ge=1, le=1000)
    activation_requested: bool = True


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


class ViewOwnerPoiLanguage(BaseModel):
    lang: str
    category: str | None
    name: str | None
    description: str | None
    translation_status: str
    audio_status: str
    audio_url: str | None
    error_message: str | None
    updated_at: datetime | None


class ViewOwnerPoiTaskSummary(BaseModel):
    id: str
    type: str
    status: str
    progress_percent: int
    step_language: str | None
    retry_count: int
    max_retries: int
    created_at: datetime
    updated_at: datetime


class ViewOwnerPoiDetail(ViewOwnerPoi):
    localizations: list[ViewOwnerPoiLanguage]
    latest_task: ViewOwnerPoiTaskSummary | None
