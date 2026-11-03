from bson import ObjectId
from model.menu_item_submission_model import MenuItemSubmissionModel
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult, UpdateResult


class MenuItemSubmissionRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["menu_item_submission"]

    async def find_one(self, search: dict) -> MenuItemSubmissionModel | None:
        document = await self.collection.find_one(search)
        if document is None:
            return None
        return MenuItemSubmissionModel.model_validate(document)

    async def find_many(self, search: dict) -> list[MenuItemSubmissionModel]:
        documents = await self.collection.find(search).sort("created_at", -1).to_list(
            length=None
        )
        return [MenuItemSubmissionModel.model_validate(document) for document in documents]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def update_by_id(self, id: ObjectId, document: dict) -> UpdateResult:
        return await self.collection.update_one({"_id": id}, {"$set": document})
