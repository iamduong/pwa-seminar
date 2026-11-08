from enum import Enum

from bson import ObjectId
from schema.contract.base_contact import Base


class AudioStatus(str, Enum):
    PENDING = "pending"
    READY = "ready"
    PROCESSING = "processing"
    FAILED = "failed"


class PoiLocalizationModel(Base):
    poi_id: ObjectId

    lang: str
    category: str
    name: str
    description: str

    audio_url: str | None = None
    audio_status: AudioStatus = AudioStatus.PENDING
