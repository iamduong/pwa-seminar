from bson import ObjectId
from model.poi_owner_registration_model import PoiOwnerRegistrationModel
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import (
    DeleteResult,
    InsertManyResult,
    InsertOneResult,
    UpdateResult,
)


class PoiOwnerRegistrationReposioty:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi_owner_registration"]

    async def find_by_id(self, id: ObjectId) -> PoiOwnerRegistrationModel | None:
        document = await self.collection.find_one({"_id": id})

        if document is None:
            return None

        return PoiOwnerRegistrationModel.model_validate(document)

    async def find_one(self, search: dict) -> PoiOwnerRegistrationModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return PoiOwnerRegistrationModel.model_validate(document)

    async def find_search(self, search) -> list[PoiOwnerRegistrationModel]:
        cursor = self.collection.find(search)
        documents = await cursor.to_list(length=None)
        return [
            PoiOwnerRegistrationModel.model_validate(document) for document in documents
        ]

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
