from model.poi_model import GeoPointModel
from pydantic import BaseModel, Field, field_validator


class CreateOwnerRegistration(BaseModel):
    business_name: str = Field(min_length=2, max_length=200)
    business_address: str = Field(min_length=5, max_length=500)
    id_card: str = Field(pattern=r"^(?:\d{9}|\d{12})$")

    @field_validator("business_name", "business_address", "id_card")
    @classmethod
    def strip_registration_text(cls, value: str) -> str:
        return value.strip()


class CreatePoiSubmission(BaseModel):
    category_id: str
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=10, max_length=2000)
    address: str = Field(min_length=5, max_length=500)
    location: GeoPointModel
    images: list[str] = Field(default_factory=list, max_length=10)
    trigger_radius: int = Field(default=30, ge=10, le=500)
    owner_note: str = Field(default="", max_length=1000)

    @field_validator("category_id", "name", "description", "address", "owner_note")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("images")
    @classmethod
    def normalize_images(cls, value: list[str]) -> list[str]:
        return [image.strip() for image in value if image.strip()]


class UpdatePoiSubmission(BaseModel):
    poi_id: str
