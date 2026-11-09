from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ViewAdminUser(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    is_active: bool
    is_poi_owner_verified: bool
    role_id: str | None
    role_name: str | None


class AdminUserRoleOption(BaseModel):
    id: str
    name: str


class FilterAdminUser(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None
    is_poi_owner_verified: bool | None = None


class CreateAdminUser(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=150)
    phone: str = Field(min_length=10, max_length=15)
    password: str = Field(min_length=8, max_length=128)
    role_id: UUID
    is_active: bool = True

    @field_validator("full_name", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value


class UpdateAdminUser(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    full_name: str = Field(min_length=2, max_length=100)
    role_id: UUID
    is_active: bool
