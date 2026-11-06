from bson import ObjectId
from model.menu_item_model import MenuItemModel
from pymongo.asynchronous.database import AsyncDatabase
from datetime import UTC, datetime
from pymongo import ReturnDocument


class MenuItemRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["menu_item"]

    async def find_many(
        self,
        search: dict,
        skip: int = 0,
        limit: int = 20,
    ) -> list[MenuItemModel]:
        documents = await (
            self.collection.find(search)
            .sort([("created_at", -1), ("_id", -1)])
            .skip(skip)
            .limit(limit)
            .to_list(length=limit)
        )

        return [
            MenuItemModel.model_validate(document)
            for document in documents
        ]

    async def count(self, search: dict) -> int:
        return await self.collection.count_documents(search)

    async def insert_item(self, item: MenuItemModel) -> MenuItemModel:
        await self.collection.insert_one(item.to_dump())
        return item

    async def upsert_from_submission(
        self,
        item: MenuItemModel,
    ) -> MenuItemModel:
        # Một yêu cầu luôn dùng một ID món cố định.
        # Gọi lại không tạo thêm món và không ghi đè món đã tồn tại.
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
            {
                "_id": item_id,
                "poi_id": poi_id,
                "deleted_at": None,
            },
            {
                "$set": {
                    "is_active": True,
                    "updated_at": datetime.now(UTC),
                }
            },
            return_document=ReturnDocument.AFTER,
        )

        if document is None:
            return None

        return MenuItemModel.model_validate(document)