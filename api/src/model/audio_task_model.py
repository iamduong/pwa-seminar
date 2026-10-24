from datetime import datetime
from enum import Enum

from bson import ObjectId
from schema.contract.base_contact import Base


class AudioTaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AudioTaskModel(Base):
    poi_id: ObjectId
    languages: list[str]
    completed_languages: list[str]
    status: AudioTaskStatus = AudioTaskStatus.QUEUED
    error_message: str | None = None
    heartbeat_at: datetime | None = None
    expires_at: datetime | None = None
