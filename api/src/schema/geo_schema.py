from typing import Literal

from pydantic import BaseModel, Field, model_validator


class GeoPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: list[float] = Field(min_length=2, max_length=2)

    @model_validator(mode="after")
    def validate_coordinates(self):
        longitude, latitude = self.coordinates
        if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
            raise ValueError("Tọa độ địa điểm không hợp lệ")
        return self
