from datetime import datetime

from bson import ObjectId
from model.role_model import RoleModel
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertManyResult, InsertOneResult, UpdateResult


class RoleRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["role"]

    # Find document
    async def find_one(self, search: dict) -> RoleModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return RoleModel.model_validate(document)

    async def find_search(self, search: dict) -> list[RoleModel]:
        cursor = self.collection.find(search)
        documents = await cursor.to_list(length=None)

        return [RoleModel.model_validate(document) for document in documents]

    async def count_filter(self, search: dict) -> int:
        return await self.collection.count_documents(search)

    async def find_pagination(
        self,
        page: int,
        page_size: int,
        search: dict,
    ) -> list[RoleModel]:
        cursor = (
            self.collection.find(search)
            .sort(
                [
                    ("priority", 1),
                    ("_id", 1),
                ]
            )
            .skip((page - 1) * page_size)
            .limit(page_size)
        )

        documents = await cursor.to_list(length=page_size)

        return [RoleModel.model_validate(document) for document in documents]

    # Insert document
    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def insert_items(self, documents: list[dict]) -> InsertManyResult:
        return await self.collection.insert_many(documents)

    # Update document
    async def update_by_id(
        self,
        role_id: ObjectId,
        document: dict,
    ) -> UpdateResult:
        return await self.collection.update_one(
            {
                "_id": role_id,
                "deleted_at": None,
            },
            {
                "$set": document,
            },
        )

    # Soft delete document
    async def delete_by_id(
        self,
        role_id: ObjectId,
        deleted_at: datetime,
    ) -> UpdateResult:
        return await self.collection.update_one(
            {
                "_id": role_id,
                "deleted_at": None,
            },
            {
                "$set": {
                    "deleted_at": deleted_at,
                    "updated_at": deleted_at,
                },
            },
        )

    async def restore_by_id(
        self,
        role_id: ObjectId,
        restored_at: datetime,
    ) -> UpdateResult:
        return await self.collection.update_one(
            {
                "_id": role_id,
                "deleted_at": {"$ne": None},
            },
            {
                "$set": {
                    "deleted_at": None,
                    "updated_at": restored_at,
                },
            },
        )
