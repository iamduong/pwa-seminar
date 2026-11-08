from datetime import datetime
from enum import Enum

from bson import ObjectId
from pydantic import BaseModel
from schema.contract.base_contact import Base


class PoiTaskType(str, Enum):
    CREATE = "create"
    UPDATE = "update"


class PoiTaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    FAILED = "failed"
    DONE = "done"


class ProcessStatus(str, Enum):
    PENDING = "pending"
    DONE = "done"
    FAILED = "failed"


class Event(BaseModel):
    message: str
    language: str | None = None
    started_at: datetime


class Process(BaseModel):
    language: str
    translation_status: ProcessStatus = ProcessStatus.PENDING
    audio_status: ProcessStatus = ProcessStatus.PENDING
    audio_url: str | None = None
    error_message: str | None = None


class PoiTaskModel(Base):
    poi_id: ObjectId
    type: PoiTaskType
    status: PoiTaskStatus = PoiTaskStatus.QUEUED
    progress_percent: int
    target_languages: list[str]
    step_language: str | None = None
    activation_requested: bool
    retry_count: int = 0
    max_retries: int = 3
    events: list[Event]
    processes: list[Process]
