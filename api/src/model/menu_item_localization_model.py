from enum import Enum

from bson import ObjectId
from schema.contract.base_contact import Base


class AudioStatus(str, Enum):
    PENDING = "pending"
    READY = "ready"
    PROCESSING = "processing"
    FAILED = "failed"


class MenuItemLocalizationModel(Base):
    menu_item_id: ObjectId
    lang: str
    name: str
    description: str | None = None
    audio_url: str | None = None
    audio_status: AudioStatus = AudioStatus.PENDING
