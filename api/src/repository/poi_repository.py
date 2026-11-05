from datetime import datetime

from model.poi_model import PoiModel
from pymongo import ASCENDING, DESCENDING
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult


class PoiRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi"]

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def find_public_changed_between(
        self,
        lang: str,
        updated_after: datetime,
        updated_before: datetime,
    ) -> list[dict]:
        cursor = await self.collection.aggregate(
            [
                {
                    "$match": {
                        "is_active": True,
                        "deleted_at": None,
                        "updated_at": {
                            "$gt": updated_after,
                            "$lte": updated_before,
                        },
                    }
                },
                {
                    "$lookup": {
                        "from": "poi_localization",
                        "let": {"poi_id": "$_id"},
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$and": [
                                            {"$eq": ["$poi_id", "$$poi_id"]},
                                            {"$eq": ["$lang", lang]},
                                            {"$eq": ["$deleted_at", None]},
                                        ]
                                    }
                                }
                            },
                            {"$limit": 1},
                        ],
                        "as": "localizations",
                    }
                },
                {
                    "$set": {
                        "localization": {"$first": "$localizations"},
                    }
                },
                {
                    "$set": {
                        "category_name": {
                            "$ifNull": ["$localization.category", "$category_name"]
                        },
                        "name": {"$ifNull": ["$localization.name", "$name"]},
                        "description": {
                            "$ifNull": ["$localization.description", "$description"]
                        },
                        "audio_url": "$localization.audio_url",
                        "lang": lang,
                    }
                },
                {"$unset": ["localizations", "localization"]},
                {"$sort": {"updated_at": ASCENDING, "_id": ASCENDING}},
            ]
        )

        return await cursor.to_list()

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
