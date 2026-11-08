from datetime import UTC, datetime

from bson import ObjectId
from core.dependency import MongoDB
from fastapi import HTTPException
from model.menu_item_model import MenuItemModel
from repository.menu_item_repository import MenuItemRepository
from schema.menu_item_schema import MenuItemSave, MenuItemView


class MenuItemService:
    def __init__(self, db: MongoDB):
        self.db = db
        self.repository = MenuItemRepository(db)

    async def _owned_poi(self, owner_id: str, poi_id: str) -> None:
        document = await self.db["poi"].find_one(
            {"_id": ObjectId(poi_id), "owner_id": ObjectId(owner_id), "deleted_at": None}
        )
        if document is None:
            raise HTTPException(404, "Không tìm thấy địa điểm thuộc tài khoản")

    @staticmethod
    def _view(item: MenuItemModel) -> MenuItemView:
        return MenuItemView(**(item.model_dump() | {"id": str(item.id), "poi_id": str(item.poi_id)}))

    async def create(self, owner_id: str, body: MenuItemSave) -> MenuItemView:
        await self._owned_poi(owner_id, body.poi_id)
        existing = await self.repository.find_one(
            {"poi_id": ObjectId(body.poi_id), "name": body.name, "is_active": False, "deleted_at": None}
        )
        if existing is not None:
            raise HTTPException(409, "Món ăn này đang chờ duyệt")
        item = MenuItemModel(**(body.model_dump() | {"poi_id": ObjectId(body.poi_id), "is_active": False}))
        result = await self.repository.insert_item(item.to_dump())
        item.id = result.inserted_id
        return self._view(item)

    async def get_owned(self, owner_id: str, item_id: str) -> MenuItemView:
        item = await self.repository.find_one({"_id": ObjectId(item_id), "deleted_at": None})
        if item is None:
            raise HTTPException(404, "Không tìm thấy món ăn")
        await self._owned_poi(owner_id, str(item.poi_id))
        return self._view(item)

    async def update(self, owner_id: str, item_id: str, body: MenuItemSave) -> MenuItemView:
        item = await self.get_owned(owner_id, item_id)
        await self._owned_poi(owner_id, body.poi_id)
        changes = body.model_dump() | {
            "poi_id": ObjectId(body.poi_id), "is_active": False, "updated_at": datetime.now(UTC)
        }
        result = await self.repository.update_item(ObjectId(item_id), ObjectId(item.poi_id), changes)
        if result.matched_count == 0:
            raise HTTPException(404, "Không tìm thấy món ăn")
        return await self.get_owned(owner_id, item_id)

    async def list_self(self, owner_id: str) -> list[MenuItemView]:
        pois = await self.list_owned_pois(owner_id)
        items = await self.repository.find_many(
            {"poi_id": {"$in": [ObjectId(poi["id"]) for poi in pois]}, "deleted_at": None}
        )
        return [self._view(item) for item in items]

    async def list_public(self, poi_id: str) -> list[MenuItemView]:
        poi = await self.db["poi"].find_one(
            {"_id": ObjectId(poi_id), "is_active": True, "deleted_at": None}
        )
        if poi is None:
            raise HTTPException(404, "Không tìm thấy địa điểm")
        items = await self.repository.find_many(
            {"poi_id": ObjectId(poi_id), "is_active": True, "is_available": True, "deleted_at": None}
        )
        return [self._view(item) for item in items]

    async def list_owned_pois(self, owner_id: str) -> list[dict]:
        documents = await self.db["poi"].find(
            {"owner_id": ObjectId(owner_id), "deleted_at": None}
        ).to_list(length=None)
        return [{"id": str(item["_id"]), "name": item["name"]} for item in documents]
