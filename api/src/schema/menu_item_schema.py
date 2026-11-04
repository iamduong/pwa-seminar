from datetime import datetime
from typing import Literal

from model.menu_item_submission_model import MenuItemSubmissionStatus
from pydantic import BaseModel, Field


class MenuItemSubmissionCreate(BaseModel):
    poi_id: str
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    price: float | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=500)


class MenuItemSubmissionView(BaseModel):
    id: str
    owner_id: str
    poi_id: str
    name: str
    description: str | None
    price: float | None
    image_url: str | None
    status: MenuItemSubmissionStatus
    admin_note: str | None
    created_at: datetime
    updated_at: datetime


class MenuItemSubmissionFilter(BaseModel):
    status: Literal[
        MenuItemSubmissionStatus.PENDING,
        MenuItemSubmissionStatus.APPROVED,
        MenuItemSubmissionStatus.REJECTED,
    ] | None = None
