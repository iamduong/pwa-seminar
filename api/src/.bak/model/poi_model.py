from enum import Enum
from typing import Literal

from bson import ObjectId
from pydantic import BaseModel, Field, model_validator
from schema.contract.base_contact import Base


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
    category_name: str

    name: str
    description: str
    address: str
    location: GeoPointModel

    images: list[str]
    trigger_radius: float = 30

    # Whether the POI is publicly visible to client applications
    is_active: bool = False
    # Automatically activate the POI when required content and audio are ready
    activation_requested: bool = False
    # Playback priority when multiple POIs are nearby; lower values have higher priority
    audio_priority: int = 100
    # Overall audio generation status for the POI, can't change
    audio_status: AudioStatus = AudioStatus.PENDING
