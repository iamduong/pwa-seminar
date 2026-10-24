from pydantic import BaseModel, Field


class ViewPoiCategory(BaseModel):
    id: str
    name: str


class FilterPoiCategory(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    q: str | None = Field(default=None, max_length=100)
