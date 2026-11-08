from datetime import datetime
from typing import Literal

from model.poi_submission_model import PoiSubmissionStatus, PoiSubmissionType
from pydantic import BaseModel, Field
from schema.geo_schema import GeoPoint


class ViewPoiSubmission(BaseModel):
    id: str
    owner_id: str
    poi_id: str | None = None
    submission_type: PoiSubmissionType
    category_id: str
    category_name: str
    name: str
    description: str
    address: str
    location: GeoPoint
    images: list[str]
    trigger_radius: int
    owner_note: str
    status: PoiSubmissionStatus
    admin_note: str | None = None
    created_at: datetime
    updated_at: datetime


class FilterPoiSubmission(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=255)
    category_id: str | None = None
    status: PoiSubmissionStatus | None = None


class ReviewPoiSubmission(BaseModel):
    status: Literal["approved", "rejected"]
    admin_note: str
    activation_requested: bool = True
    audio_priority: int = 100


class RegisterPoiSubmission(BaseModel):
    category_id: str
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=5000)
    address: str = Field(min_length=1, max_length=500)
    location: GeoPoint
    images: list[str] = Field(default_factory=list, max_length=10)
    trigger_radius: int = Field(default=30, ge=10, le=500)
    owner_note: str = Field(default="", max_length=1000)
