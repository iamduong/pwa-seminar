from datetime import UTC, datetime

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field


def utc_now() -> datetime:
    return datetime.now(UTC)


# arbitrary_types_allowed: allow pydantic uses ObjectId (bson)
# populate_by_name: allow use both id and _id
# alias: mapping _id in document to id in pydantic when validate_model and dump
class Base(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        use_enum_values=True,
    )

    id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    deleted_at: datetime | None = None

    def to_dump(self) -> dict:
        return self.model_dump(by_alias=True)
