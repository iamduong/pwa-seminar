from datetime import datetime
from typing import Literal

from model.poi_task_event_model import PoiTaskEventModel
from model.poi_task_model import PoiTaskStatus, PoiTaskType
from model.poi_task_process_model import PoiTaskProcessModel
from pydantic import BaseModel, ConfigDict, Field


class EventView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    message: str
    language: str | None
    started_at: datetime


class ProcessView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    language: str
    translation_status: str
    audio_status: str
    audio_url: str | None
    error_message: str | None


class ViewPoiTask(BaseModel):
    id: str
    poi_id: str
    type: PoiTaskType
    status: PoiTaskStatus
    progress_percent: int
    target_languages: list[str]
    step_language: str | None
    activation_requested: bool
    retry_count: int
    max_retries: int
    events: list[EventView]
    processes: list[ProcessView]
    created_at: datetime
    updated_at: datetime


class FilterPoiTask(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=5, ge=1, le=100)
    view_status: Literal["done", "processing", "failed"] | None = None
