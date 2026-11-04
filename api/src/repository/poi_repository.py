from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult


class PoiRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi"]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)
