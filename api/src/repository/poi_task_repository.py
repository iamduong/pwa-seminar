from datetime import datetime

from model.poi_task_model import PoiTaskModel
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult
from pymongo import ASCENDING, DESCENDING


class PoiTaskRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi_task"]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def count_filter(
        self,
        condition: dict,
    ) -> int:
        return await self.collection.count_documents(condition)

    async def find_one(
        self,
        condition: dict,
    ) -> PoiTaskModel | None:
        document = await self.collection.find_one(condition)

        if document is None:
            return None

        return PoiTaskModel.model_validate(document)

    async def find_pagination(
        self,
        condition: dict,
        page: int,
        page_size: int,
    ) -> list[PoiTaskModel]:
        cursor = (self.collection
            .find(condition)
            .sort(
                [
                    ("created_at", DESCENDING),
                    ("_id", DESCENDING),
                ]
            )
            .skip((page - 1) * page_size)
            .limit(page_size)
        )

        documents = await cursor.to_list()

        return [
            PoiTaskModel.model_validate(document)
            for document in documents
        ]

    async def find_updated_after(
        self,
        updated_after: datetime,
    ) -> list[PoiTaskModel]:
        cursor = (
            self.collection
            .find(
                {
                    "deleted_at": None,
                    "updated_at": {"$gt": updated_after},
                }
            )
            .sort("updated_at", ASCENDING)
        )

        documents = await cursor.to_list()

        return [
            PoiTaskModel.model_validate(document)
            for document in documents
        ]
