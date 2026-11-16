from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class FilterTour(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)
    is_deleted: bool = False


class CreateTour(BaseModel):
    price: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    max_people: int = Field(gt=0, le=100_000)
    expires_at: datetime
    poi_ids: list[str] = Field(min_length=1, max_length=100)

    @field_validator("poi_ids")
    @classmethod
    def unique_poi_ids(cls, values: list[str]) -> list[str]:
        if len(values) != len(set(values)):
            raise ValueError("Danh sách POI không được trùng lặp")
        return values


class ViewTourPoi(BaseModel):
    id: str
    name: str
    address: str


class ViewTour(BaseModel):
    id: str
    code: str
    price: Decimal
    max_people: int
    scanned_people: int
    expires_at: datetime
    pois: list[ViewTourPoi]
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
