from enum import Enum
from typing import Literal

from bson import ObjectId
from model._base import Base
from pydantic import BaseModel, Field, model_validator


class AudioStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class GeoPointModel(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: list[float] = Field(min_length=2, max_length=2)

    @model_validator(mode="after")
    def validate_coordinates(self):
        longitude, latitude = self.coordinates
        if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
            raise ValueError("Tọa độ địa điểm không hợp lệ")
        return self


class PoiModel(Base):
    owner_id: ObjectId | None = None
    category_id: ObjectId
    name: str
    description: str
    address: str
    location: GeoPointModel
    images: list[str]
    trigger_radius: float = 30
    is_active: bool = False
    activation_requested: bool = False
    audio_priority: int = 100
    audio_status: AudioStatus = AudioStatus.PENDING
