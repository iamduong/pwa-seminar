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

    # Find document
    async def find_one(self, search: dict) -> PoiOwnerRegistrationModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return PoiOwnerRegistrationModel.model_validate(document)

    # Find document by pagination
    async def count_filter(self, pipeline: list[dict]) -> int:
        pipeline = [*pipeline, {"$count": "total"}]

        cursor = await self.collection.aggregate(pipeline)
        documents = await cursor.to_list()

        if not documents:
            return 0

        return documents[0]["total"]

    async def find_pagination(
        self, pipeline: list[dict], page: int, page_size: int
    ) -> list[PoiOwnerRegistrationModel]:
        pipeline = [
            *pipeline,
            {"$sort": {"_id": 1}},
            {"$skip": (page - 1) * page_size},
            {"$limit": page_size},
        ]

        cursor = await self.collection.aggregate(pipeline)
        documents = await cursor.to_list()

        return [
            PoiOwnerRegistrationModel.model_validate(document) for document in documents
        ]

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
