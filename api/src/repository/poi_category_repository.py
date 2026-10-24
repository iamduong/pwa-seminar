from core.pagination import Pagination
from model.poi_category_model import PoiCategoryModel
from pymongo import ASCENDING
from pymongo.asynchronous.database import AsyncDatabase
from schema.poi_category_schema import ViewPoiCategory


class PoiCategoryRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi_category"]

    # Find document
    async def find_one(self, search: dict) -> PoiCategoryModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return PoiCategoryModel.model_validate(document)

    async def find_pagination(
        self, page: int, page_size: int, search: dict
    ) -> Pagination[ViewPoiCategory]:
        skip = (page - 1) * page_size

        total_items = await self.collection.count_documents(search)
        total_pages = (total_items + page_size - 1) // page_size

        pipeline = [
            {"$match": search},
            {"$sort": {"_id": ASCENDING}},
            {"$skip": skip},
            {"$limit": page_size},
        ]

        cursor = await self.collection.aggregate(pipeline)
        documents = await cursor.to_list()

        print(documents)

        result = [
            ViewPoiCategory(
                id=str(document["_id"]),
                name=document["name"],
            )
            for document in documents
        ]

        return Pagination[ViewPoiCategory](
            items=result,
            page=page,
            page_size=page_size,
            item_count=len(result),
            total_items=total_items,
            total_pages=total_pages,
        )
