from datetime import UTC, datetime

from bson import ObjectId
from model.menu_item_model import MenuItemModel
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult, UpdateResult


class MenuItemRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["menu_item"]

    async def find_one(self, search: dict) -> MenuItemModel | None:
        document = await self.collection.find_one(search)
        return MenuItemModel.model_validate(document) if document is not None else None

    async def find_many(
        self,
        search: dict,
        skip: int = 0,
        limit: int | None = None,
    ) -> list[MenuItemModel]:
        cursor = self.collection.find(search).sort([("created_at", -1), ("_id", -1)]).skip(skip)
        if limit is not None:
            cursor = cursor.limit(limit)
        documents = await cursor.to_list(length=limit)
        return [MenuItemModel.model_validate(document) for document in documents]

    async def count(self, search: dict) -> int:
        return await self.collection.count_documents(search)

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def update_item(
        self,
        id: ObjectId,
        poi_id: ObjectId,
        document: dict,
    ) -> UpdateResult:
        return await self.collection.update_one(
            {"_id": id, "poi_id": poi_id, "deleted_at": None},
            {"$set": document},
        )

    async def upsert_from_submission(self, item: MenuItemModel) -> MenuItemModel:
        await self.collection.update_one(
            {"_id": item.id},
            {"$setOnInsert": item.to_dump()},
            upsert=True,
        )
        document = await self.collection.find_one({"_id": item.id})
        return MenuItemModel.model_validate(document)

    async def approve(
        self,
        poi_id: ObjectId,
        item_id: ObjectId,
    ) -> MenuItemModel | None:
        document = await self.collection.find_one_and_update(
            {"_id": item_id, "poi_id": poi_id, "deleted_at": None},
            {"$set": {"is_active": True, "updated_at": datetime.now(UTC)}},
            return_document=ReturnDocument.AFTER,
        )
        return MenuItemModel.model_validate(document) if document is not None else None
