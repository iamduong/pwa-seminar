from typing import Literal

from model.poi_owner_registration_model import PoiOwnerRegistrationStatus
from pydantic import BaseModel, Field, model_validator


class ViewPoiOwnerRegistration(BaseModel):
    pass


class FilterPoiOwnerRegistration(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    q: str | None = Field(default=None, max_length=100)
    status: (
        Literal[
            PoiOwnerRegistrationStatus.PENDING,
            PoiOwnerRegistrationStatus.APPROVED,
            PoiOwnerRegistrationStatus.REJECTED,
        ]
        | None
    ) = None


class RegisterPoiOwnerRegistration(BaseModel):
    business_name: str
    business_address: str
    id_card: str
    note: str


class ReviewPoiPOwnerRegistration(BaseModel):
    status: Literal[
        PoiOwnerRegistrationStatus.APPROVED, PoiOwnerRegistrationStatus.REJECTED
    ]
    admin_note: str | None = None

    @model_validator(mode="after")
    def require_rejection_reason(self):
        if (
            self.status == PoiOwnerRegistrationStatus.REJECTED
            and not (self.admin_note or "").strip()
        ):
            raise ValueError("Yêu cầu có lý do từ chối")

        if self.admin_note is not None:
            self.admin_note = self.admin_note.strip()

        return self
