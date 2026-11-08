from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class FilterRole(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)
    is_deleted: bool = False


class CreateRole(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=50, pattern=r"^[a-z][a-z0-9_]*$")
    permissions: list[str] = Field(default_factory=list)
    priority: int = Field(default=10, ge=0, le=1000)


class UpdateRole(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str | None = Field(default=None, min_length=2, max_length=50, pattern=r"^[a-z][a-z0-9_]*$")
    permissions: list[str] | None = None
    priority: int | None = Field(default=None, ge=0, le=1000)

    @model_validator(mode="after")
    def require_at_least_one_field(self):
        if self.name is None and self.permissions is None and self.priority is None:
            raise ValueError("Cần cung cấp ít nhất một trường để cập nhật")
        return self


class ViewRole(BaseModel):
    id: str
    name: str
    permissions: list[str]
    is_system: bool
    priority: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
