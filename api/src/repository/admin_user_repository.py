from bson import ObjectId
from model.admin_user_model import AdminUserModel
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import (
    DeleteResult,
    InsertManyResult,
    InsertOneResult,
    UpdateResult,
)


class AdminUserRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["admin_user"]

    # Find document
    async def find_one(self, search: dict) -> AdminUserModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return AdminUserModel.model_validate(document)

    async def find_search(self, search: dict) -> list[AdminUserModel]:
        cursor = self.collection.find(search)
        documents = await cursor.to_list(length=None)
        return [AdminUserModel.model_validate(document) for document in documents]

    async def find_pagination(
        self, page: int, page_size: int, search: dict, sort_by: str, sort_order: str
    ):
        pass

    # Insert document
    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def insert_items(self, documents: list[dict]) -> InsertManyResult:
        pass

    # Update document
    async def update_by_id(self, id: ObjectId, document: dict) -> UpdateResult:
        return await self.collection.update_one({"_id": id}, {"$set": document})

    # Delete document
    async def delete_by_id(self, id: ObjectId, document: dict) -> DeleteResult:
        pass
