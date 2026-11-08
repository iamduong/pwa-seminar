from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from model.poi_task_model import (
    Event,
    PoiTaskStatus,
    PoiTaskType,
    Process,
)


class ViewPoiTask(BaseModel):
    id: str
    poi_id: str
    type: PoiTaskType
    status: PoiTaskStatus
    progress_percent: int
    target_languages: list[str]
    step_language: str | None
    activation_requested: bool
    events: list[Event]
    processes: list[Process]
    created_at: datetime
    updated_at: datetime


class FilterPoiTask(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=5, ge=1, le=100)
    view_status: Literal["done", "processing", "failed"] | None = None