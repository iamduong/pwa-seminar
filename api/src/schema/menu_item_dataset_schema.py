from datetime import datetime

from pydantic import BaseModel
from schema.menu_item_schema import MenuItemView

class MenuItemDataset(BaseModel):
    etag: str
    updated_after: datetime | None
    menu_items: list[MenuItemView]
