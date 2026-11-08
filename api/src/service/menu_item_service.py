import re
from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from core.dependency import MongoDB
from core.pagination import Pagination
from fastapi import HTTPException, status
from model.menu_item_model import MenuItemModel
from repository.menu_item_repository import MenuItemRepository
from schema.menu_item_schema import (
    MenuItemCreate,
    MenuItemFilter,
    MenuItemSave,
    MenuItemView,
)


class MenuItemService:
    def __init__(self, db: MongoDB):
        self.db = db
        self.repository = MenuItemRepository(db)

    @staticmethod
    def _object_id(value: str, label: str) -> ObjectId:
        try:
            return ObjectId(value)
        except (InvalidId, TypeError) as error:
            raise HTTPException(status_code=400, detail=f"{label} không hợp lệ") from error

    async def _owned_poi(self, owner_id: str, poi_id: str) -> None:
        document = await self.db["poi"].find_one(
            {
                "_id": self._object_id(poi_id, "Mã địa điểm"),
                "owner_id": self._object_id(owner_id, "Mã chủ quán"),
                "deleted_at": None,
            }
        )
        if document is None:
            raise HTTPException(404, "Không tìm thấy địa điểm thuộc tài khoản")

    async def _require_poi(self, poi_id: str) -> dict:
        document = await self.db["poi"].find_one(
            {"_id": self._object_id(poi_id, "Mã POI"), "deleted_at": None}
        )
        if document is None:
            raise HTTPException(404, "Không tìm thấy địa điểm")
        return document

    @staticmethod
    def _view(item: MenuItemModel) -> MenuItemView:
        return MenuItemView(
            **(item.model_dump() | {"id": str(item.id), "poi_id": str(item.poi_id)})
        )

    async def create(self, owner_id: str, body: MenuItemSave) -> MenuItemView:
        await self._owned_poi(owner_id, body.poi_id)
        poi_id = self._object_id(body.poi_id, "Mã địa điểm")
        existing = await self.repository.find_one(
            {
                "poi_id": poi_id,
                "name": body.name,
                "is_active": False,
                "deleted_at": None,
            }
        )
        if existing is not None:
            raise HTTPException(409, "Món ăn này đang chờ duyệt")

        item = MenuItemModel(
            **(body.model_dump() | {"poi_id": poi_id, "is_active": False})
        )
        result = await self.repository.insert_item(item.to_dump())
        item.id = result.inserted_id
        return self._view(item)

    async def get_owned(self, owner_id: str, item_id: str) -> MenuItemView:
        item = await self.repository.find_one(
            {"_id": self._object_id(item_id, "Mã món ăn"), "deleted_at": None}
        )
        if item is None:
            raise HTTPException(404, "Không tìm thấy món ăn")
        await self._owned_poi(owner_id, str(item.poi_id))
        return self._view(item)

    async def update(
        self,
        owner_id: str,
        item_id: str,
        body: MenuItemSave,
    ) -> MenuItemView:
        item = await self.get_owned(owner_id, item_id)
        await self._owned_poi(owner_id, body.poi_id)
        changes = body.model_dump() | {
            "poi_id": self._object_id(body.poi_id, "Mã địa điểm"),
            "is_active": False,
            "updated_at": datetime.now(UTC),
        }
        result = await self.repository.update_item(
            self._object_id(item_id, "Mã món ăn"),
            self._object_id(item.poi_id, "Mã địa điểm"),
            changes,
        )
        if result.matched_count == 0:
            raise HTTPException(404, "Không tìm thấy món ăn")
        return await self.get_owned(owner_id, item_id)

    async def list_self(self, owner_id: str) -> list[MenuItemView]:
        pois = await self.list_owned_pois(owner_id)
        items = await self.repository.find_many(
            {
                "poi_id": {"$in": [ObjectId(poi["id"]) for poi in pois]},
                "deleted_at": None,
            }
        )
        return [self._view(item) for item in items]

    async def list_public(self, poi_id: str) -> list[MenuItemView]:
        object_id = self._object_id(poi_id, "Mã địa điểm")
        poi = await self.db["poi"].find_one(
            {"_id": object_id, "is_active": True, "deleted_at": None}
        )
        if poi is None:
            raise HTTPException(404, "Không tìm thấy địa điểm")
        items = await self.repository.find_many(
            {
                "poi_id": object_id,
                "is_active": True,
                "is_available": True,
                "deleted_at": None,
            }
        )
        return [self._view(item) for item in items]

    async def list_owned_pois(self, owner_id: str) -> list[dict]:
        documents = await self.db["poi"].find(
            {
                "owner_id": self._object_id(owner_id, "Mã chủ quán"),
                "deleted_at": None,
            }
        ).to_list(length=None)
        return [{"id": str(item["_id"]), "name": item["name"]} for item in documents]

    async def list_by_poi(
        self,
        poi_id: str,
        filters: MenuItemFilter,
    ) -> Pagination[MenuItemView]:
        poi = await self._require_poi(poi_id)
        search: dict = {"poi_id": poi["_id"], "deleted_at": None}
        if filters.is_active is False:
            search["is_active"] = {"$ne": True}
        elif filters.is_active is True:
            search["is_active"] = True
        query = (filters.q or "").strip()
        if query:
            search["name"] = {"$regex": re.escape(query), "$options": "i"}

        total = await self.repository.count(search)
        items = await self.repository.find_many(
            search,
            skip=(filters.page - 1) * filters.page_size,
            limit=filters.page_size,
        )
        return Pagination[MenuItemView](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._view(item) for item in items],
        )

    async def create_direct(
        self,
        poi_id: str,
        body: MenuItemCreate,
    ) -> MenuItemView:
        poi = await self._require_poi(poi_id)
        item = MenuItemModel(poi_id=poi["_id"], is_active=True, **body.model_dump())
        result = await self.repository.insert_item(item.to_dump())
        item.id = result.inserted_id
        return self._view(item)

    async def list_admin_pois(
        self,
        filters: MenuItemFilter,
    ) -> Pagination[dict[str, str]]:
        search: dict = {"deleted_at": None}
        query = (filters.q or "").strip()
        if query:
            search["name"] = {"$regex": re.escape(query), "$options": "i"}
        collection = self.db["poi"]
        total = await collection.count_documents(search)
        documents = await (
            collection.find(search)
            .sort([("created_at", -1), ("_id", -1)])
            .skip((filters.page - 1) * filters.page_size)
            .limit(filters.page_size)
            .to_list(length=filters.page_size)
        )
        return Pagination[dict[str, str]](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[
                {
                    "id": str(document["_id"]),
                    "name": document["name"],
                    "address": document.get("address", ""),
                }
                for document in documents
            ],
        )

    async def get_poi_summary(self, poi_id: str) -> dict[str, str]:
        document = await self._require_poi(poi_id)
        return {
            "id": str(document["_id"]),
            "name": document["name"],
            "address": document.get("address", ""),
        }

    async def approve_item(self, poi_id: str, item_id: str) -> MenuItemView:
        poi = await self._require_poi(poi_id)
        item = await self.repository.approve(
            poi_id=poi["_id"],
            item_id=self._object_id(item_id, "Mã món ăn"),
        )
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy món ăn tại địa điểm này",
            )
        return self._view(item)
