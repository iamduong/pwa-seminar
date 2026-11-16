from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class FilterTransactionLog(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    q: str | None = Field(default=None, max_length=100)
    date_from: date | None = None
    date_to: date | None = None

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("Ngày bắt đầu không được sau ngày kết thúc")
        return self


class IPNTransactionPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    transaction_date: datetime = Field(alias="transactionDate")
    content: str = Field(default="", max_length=5000)
    transfer_type: Literal["in", "out"] = Field(alias="transferType")
    transfer_amount: Decimal = Field(
        alias="transferAmount",
        gt=0,
        max_digits=14,
        decimal_places=2,
    )
    reference_code: str = Field(alias="referenceCode", min_length=1, max_length=100)


class ViewTransactionLog(BaseModel):
    id: str
    transaction_date: datetime
    content: str
    amount: Decimal
    reference_code: str
    created_at: datetime


class ViewTransactionLogPage(BaseModel):
    page: int
    page_size: int
    total_item: int
    total_page: int
    total_amount: Decimal
    data: list[ViewTransactionLog]


class ViewIPNResult(BaseModel):
    created: bool
    transaction: ViewTransactionLog
