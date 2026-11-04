from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult


class PoiTaskRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi_task"]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)
