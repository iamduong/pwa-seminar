from bson import ObjectId
from schema.contract.base_contact import Base


class MenuItemModel(Base):
    poi_id: ObjectId
    name: str
    description: str | None = None
    price: float | None = None
    image_url: str | None = None

    # Admin đã duyệt để hiển thị.
    is_active: bool = False

    # Món đang được bán.
    is_available: bool = True