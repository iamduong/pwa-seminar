from model.poi_model import GeoPointModel
from pydantic import BaseModel


class ViewPoiSubmission(BaseModel):
    pass


class FilterPoiSubmission(BaseModel):
    pass


class CreatePoiSubmission(BaseModel):
    category_id: str
    name: str
    description: str
    address: str
    location: GeoPointModel
    images: list[str]
    trigger_radius: int
    owner_note: str
