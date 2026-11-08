from bson import ObjectId
from model.poi_submission_model import PoiSubmissionModel
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult


class PoiSubmissionRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi_submission"]

    async def find_one(self, search: dict) -> PoiSubmissionModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return PoiSubmissionModel.model_validate(document)

    async def count_filter(self, pipeline: list[dict]) -> int:
        cursor = await self.collection.aggregate([*pipeline, {"$count": "total"}])
        documents = await cursor.to_list()

        if not documents:
            return 0

        return documents[0]["total"]

    async def find_pagination(
        self, pipeline: list[dict], page: int, page_size: int
    ) -> list[PoiSubmissionModel]:
        cursor = await self.collection.aggregate(
            [
                *pipeline,
                {"$sort": {"created_at": DESCENDING, "_id": DESCENDING}},
                {"$skip": (page - 1) * page_size},
                {"$limit": page_size},
            ]
        )
        documents = await cursor.to_list()

        return [PoiSubmissionModel.model_validate(document) for document in documents]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def update_by_id(self, id: ObjectId, document: dict):
        return await self.collection.update_one({"_id": id}, {"$set": document})
