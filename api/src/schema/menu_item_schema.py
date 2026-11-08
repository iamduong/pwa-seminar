from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MenuItemSave(BaseModel):
    poi_id: str
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    price: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    image_url: str | None = Field(default=None, max_length=500)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value


class MenuItemCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    price: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    image_url: str | None = Field(default=None, max_length=500)
    is_available: bool = True


class MenuItemView(BaseModel):
    id: str
    poi_id: str
    name: str
    description: str | None
    price: float | None
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
