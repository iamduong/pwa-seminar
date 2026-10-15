from bson import ObjectId
from core.pagination import Pagination
from model.poi_submission_model import PoiSubmissionModel
from pymongo import DESCENDING
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import InsertOneResult, UpdateResult


class PoiSubmissionRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["poi_submission"]

    async def find_by_id(self, submission_id: ObjectId) -> PoiSubmissionModel | None:
        document = await self.collection.find_one(
            {"_id": submission_id, "deleted_at": None}
        )
        return PoiSubmissionModel.model_validate(document) if document else None

    async def find_one(self, search: dict) -> PoiSubmissionModel | None:
        document = await self.collection.find_one(search)
        return PoiSubmissionModel.model_validate(document) if document else None

    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def update_by_id(self, submission_id: ObjectId, document: dict) -> UpdateResult:
        return await self.collection.update_one(
            {"_id": submission_id}, {"$set": document}
        )

    async def review_pending(
        self, submission_id: ObjectId, document: dict
    ) -> UpdateResult:
        return await self.collection.update_one(
            {"_id": submission_id, "status": "pending"},
            {"$set": document},
        )

    async def find_owner_submissions(self, owner_id: ObjectId) -> list[dict]:
        return await self._aggregate_documents({
            "owner_id": owner_id,
            "deleted_at": None,
        })

    async def find_pagination(
        self, page: int, page_size: int, search: dict
    ) -> Pagination[dict]:
        skip = (page - 1) * page_size
        total_items = await self.collection.count_documents(search)
        total_pages = (total_items + page_size - 1) // page_size
        items = await self._aggregate_documents(search, skip, page_size)

        return Pagination[dict](
            items=items,
            page=page,
            page_size=page_size,
            item_count=len(items),
            total_items=total_items,
            total_pages=total_pages,
        )

    async def find_detail(self, submission_id: ObjectId) -> dict | None:
        documents = await self._aggregate_documents({
            "_id": submission_id,
            "deleted_at": None,
        })
        return documents[0] if documents else None

    async def _aggregate_documents(
        self,
        search: dict,
        skip: int | None = None,
        limit: int | None = None,
    ) -> list[dict]:
        pipeline: list[dict] = [
            {"$match": search},
            {"$sort": {"created_at": DESCENDING, "_id": DESCENDING}},
        ]
        if skip is not None:
            pipeline.append({"$skip": skip})
        if limit is not None:
            pipeline.append({"$limit": limit})

        pipeline.extend([
            {
                "$lookup": {
                    "from": "admin_user",
                    "localField": "owner_id",
                    "foreignField": "_id",
                    "as": "owner",
                }
            },
            {
                "$lookup": {
                    "from": "poi_category",
                    "localField": "category_id",
                    "foreignField": "_id",
                    "as": "category",
                }
            },
            {"$unwind": {"path": "$owner", "preserveNullAndEmptyArrays": True}},
            {"$unwind": {"path": "$category", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": 1,
                    "owner_id": 1,
                    "poi_id": 1,
                    "name": 1,
                    "description": 1,
                    "address": 1,
                    "location": 1,
                    "images": 1,
                    "trigger_radius": 1,
                    "owner_note": 1,
                    "status": 1,
                    "admin_note": 1,
                    "reviewed_by": 1,
                    "reviewed_at": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "owner": {
                        "id": "$owner._id",
                        "full_name": "$owner.full_name",
                        "email": "$owner.email",
                        "phone": "$owner.phone",
                    },
                    "category": {
                        "id": "$category._id",
                        "code": "$category.code",
                        "name": "$category.name",
                    },
                }
            },
        ])

        cursor = await self.collection.aggregate(pipeline)
        documents = await cursor.to_list(length=None)
        return [self._serialize(document) for document in documents]

    @staticmethod
    def _serialize(document: dict) -> dict:
        def stringify(value):
            return str(value) if isinstance(value, ObjectId) else value

        result = dict(document)
        result["id"] = str(result.pop("_id"))
        for field in ("owner_id", "poi_id", "reviewed_by"):
            result[field] = stringify(result.get(field))

        if result.get("owner"):
            result["owner"]["id"] = stringify(result["owner"].get("id"))
        if result.get("category"):
            result["category"]["id"] = stringify(result["category"].get("id"))
        return result
