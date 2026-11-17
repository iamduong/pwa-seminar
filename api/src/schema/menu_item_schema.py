from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator
from util.image import is_static_image_url


class MenuItemSave(BaseModel):
    poi_id: str
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=500)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None):
        if value is not None and not is_static_image_url(value):
            raise ValueError("Ảnh món ăn phải được tải lên hệ thống")
        return value


class MenuItemCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=500)

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None):
        if value is not None and not is_static_image_url(value):
            raise ValueError("Ảnh món ăn phải được tải lên hệ thống")
        return value


class MenuItemView(BaseModel):
    id: str
    poi_id: str
    name: str
    description: str | None
    image_url: str | None
    is_active: bool
    is_available: bool
    created_at: datetime
    updated_at: datetime


class MenuItemFilter(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = None
    is_active: bool | None = None


class MenuTranslationFilter(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    status: Literal["queued", "running", "done", "failed"] | None = None


class MenuTranslationView(BaseModel):
    id: str
    lang: str
    name: str
    description: str | None
    translation_status: Literal["pending", "processing", "ready", "failed"]
    error_message: str | None
    updated_at: datetime


class MenuTranslationTaskView(BaseModel):
    id: str
    poi_id: str
    name: str
    status: Literal["queued", "running", "done", "failed"]
    progress_percent: int
    is_available: bool
    localizations: list[MenuTranslationView]
