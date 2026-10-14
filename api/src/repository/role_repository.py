from bson import ObjectId
from pymongo.asynchronous.database import AsyncDatabase

from model.role_model import RoleModel


class RoleRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["role"]

    # Find document
    async def find_by_id(self, id: ObjectId) -> RoleModel | None:
        document = await self.collection.find_one({"_id": id})

        if document is None:
            return None

        return RoleModel.model_validate(document)

    async def find_one(self, search: dict) -> RoleModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return RoleModel.model_validate(document)

    async def find_search(self, search: dict):
        pass

    async def find_pagination(self, page: int, page_sizre: int, search: dict):
        pass

    # Insert document
    async def insert_item(self, document: dict):
        pass

    async def insert_items(self, documents: list[dict]):
        pass

    # Update document
    async def update_by_id(self, id: ObjectId, document: dict):
        pass

    # Delete document
    async def delete_by_id(self, id: ObjectId, document: dict):
        pass
