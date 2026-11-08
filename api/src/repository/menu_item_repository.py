from bson import ObjectId
from model.menu_item_model import MenuItemModel
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult, UpdateResult


class MenuItemRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["menu_item"]

    async def find_one(self, search: dict) -> MenuItemModel | None:
        document = await self.collection.find_one(search)
        return MenuItemModel.model_validate(document) if document is not None else None

    async def find_many(self, search: dict) -> list[MenuItemModel]:
        documents = await self.collection.find(search).sort("created_at", -1).to_list(length=None)
        return [MenuItemModel.model_validate(document) for document in documents]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def update_item(self, id: ObjectId, poi_id: ObjectId, document: dict) -> UpdateResult:
        return await self.collection.update_one(
            {"_id": id, "poi_id": poi_id, "deleted_at": None}, {"$set": document}
        )
