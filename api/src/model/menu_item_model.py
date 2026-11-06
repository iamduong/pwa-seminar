from bson import ObjectId
from schema.contract.base_contact import Base


class MenuItemModel(Base):
    poi_id: ObjectId
    name: str
    description: str | None = None
    price: float | None = None
    image_url: str | None = None
    is_active: bool = False
    # Is menu is available for selling
    is_available: bool = True
