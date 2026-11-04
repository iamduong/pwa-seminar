from model.poi_model import PoiModel
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult


class PoiRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi"]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def count_filter(self, pipeline: list[dict]) -> int:
        cursor = await self.collection.aggregate([*pipeline, {"$count": "total"}])
        documents = await cursor.to_list()

        if not documents:
            return 0

        return documents[0]["total"]

    async def find_pagination(
        self, pipeline: list[dict], page: int, page_size: int
    ) -> list[PoiModel]:
        cursor = await self.collection.aggregate(
            [
                *pipeline,
                {"$sort": {"created_at": DESCENDING, "_id": DESCENDING}},
                {"$skip": (page - 1) * page_size},
                {"$limit": page_size},
            ]
        )
        documents = await cursor.to_list()

        return [PoiModel.model_validate(document) for document in documents]
