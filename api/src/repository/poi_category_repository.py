from model.poi_category_model import PoiCategoryModel
from pymongo import ASCENDING
from pymongo.asynchronous.database import AsyncDatabase


class PoiCategoryRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi_category"]

    # Find document
    async def find_one(self, search: dict) -> PoiCategoryModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return PoiCategoryModel.model_validate(document)

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
    ) -> list[PoiCategoryModel]:
        pipeline = [
            *pipeline,
            {"$sort": {"_id": ASCENDING}},
            {"$skip": (page - 1) * page_size},
            {"$limit": page_size},
        ]

        cursor = await self.collection.aggregate(pipeline)
        documents = await cursor.to_list()

        return [PoiCategoryModel.model_validate(document) for document in documents]
