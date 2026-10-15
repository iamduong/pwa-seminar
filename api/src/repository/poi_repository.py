from pymongo.asynchronous.database import AsyncDatabase
from bson import ObjectId
from pymongo.results import DeleteResult, InsertOneResult


class PoiRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi"]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def delete_by_id(self, poi_id: ObjectId) -> DeleteResult:
        return await self.collection.delete_one({"_id": poi_id})

    async def find_owner_pois(self, owner_id: ObjectId) -> list[dict]:
        return await self._aggregate({
            "owner_id": owner_id,
            "deleted_at": None,
        })

    async def find_owner_poi(self, poi_id: ObjectId, owner_id: ObjectId) -> dict | None:
        documents = await self._aggregate({
            "_id": poi_id,
            "owner_id": owner_id,
            "deleted_at": None,
        })
        return documents[0] if documents else None

    async def _aggregate(self, search: dict) -> list[dict]:
        pipeline = [
            {"$match": search},
            {"$sort": {"created_at": -1}},
            {
                "$lookup": {
                    "from": "poi_category",
                    "localField": "category_id",
                    "foreignField": "_id",
                    "as": "category",
                }
            },
            {"$unwind": {"path": "$category", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": 1,
                    "owner_id": 1,
                    "name": 1,
                    "description": 1,
                    "address": 1,
                    "location": 1,
                    "images": 1,
                    "trigger_radius": 1,
                    "is_active": 1,
                    "audio_status": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "category": {
                        "id": "$category._id",
                        "code": "$category.code",
                        "name": "$category.name",
                    },
                }
            },
        ]
        cursor = await self.collection.aggregate(pipeline)
        documents = await cursor.to_list(length=None)

        for document in documents:
            document["id"] = str(document.pop("_id"))
            document["owner_id"] = str(document["owner_id"])
            if document.get("category"):
                document["category"]["id"] = str(document["category"]["id"])
        return documents
