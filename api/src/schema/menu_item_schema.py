from datetime import datetime
from typing import Literal

from model.menu_item_submission_model import MenuItemSubmissionStatus
from pydantic import BaseModel, Field, ConfigDict


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
        MenuItemSubmissionStatus.PROCESSING
    ] | None = None


class MenuItemCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    price: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    image_url: str | None = Field(default=None, max_length=500)
    is_available: bool = True


class MenuItemView(MenuItemCreate):
    id: str
    poi_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MenuItemFilter(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = None
    is_active: bool | None = None


class MenuItemReviewFilter(MenuItemFilter):
    status: MenuItemSubmissionStatus | None = None


class MenuItemReject(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    admin_note: str = Field(min_length=1, max_length=1000)