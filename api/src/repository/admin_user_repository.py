from bson import ObjectId
from core.pagination import Pagination
from model.admin_user_model import AdminUserModel
from pymongo import ASCENDING, DESCENDING
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.results import (
    DeleteResult,
    InsertManyResult,
    InsertOneResult,
    UpdateResult,
)
from view.admin_user_view import AdminUserView


class AdminUserRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["admin_user"]

    # Find document
    async def find_by_id(self, id: ObjectId) -> AdminUserModel | None:
        document = await self.collection.find_one({"_id": id})

        if document is None:
            return None

        return AdminUserModel.model_validate(document)

    async def find_one(self, search: dict) -> AdminUserModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return AdminUserModel.model_validate(document)

    async def find_search(self, search: dict) -> list[AdminUserModel]:
        cursor = self.collection.find(search)
        documents = await cursor.to_list(length=None)
        return [AdminUserModel.model_validate(document) for document in documents]

    async def find_pagination(
        self, page: int, page_size: int, search: dict, sort_by: str, sort_order: str
    ) -> Pagination[AdminUserView]:
        skip = (page - 1) * page_size
        direction = ASCENDING if sort_order.lower() == "asc" else DESCENDING

        total_items = await self.collection.count_documents(search)
        total_pages = (total_items + page_size - 1) // page_size

        pipeline = [
            {"$match": search},
            {
                "$lookup": {
                    "from": "role",
                    "localField": "role_id",
                    "foreignField": "_id",
                    "as": "role",
                }
            },
            {"$sort": {sort_by: direction, "_id": direction}},
            {"$skip": skip},
            {"$limit": page_size},
        ]

        cursor = await self.collection.aggregate(pipeline)
        documents = await cursor.to_list()

        result = [
            AdminUserView(
                id=str(document["_id"]),
                full_name=document["full_name"],
                email=document["email"],
                phone=document["phone"],
                is_active=document["is_active"],
                is_poi_owner_verified=document["is_poi_owner_verified"],
                role_id=str(document["role_id"]) if document["role_id"] else None,
                role_name=document["role"][0]["name"] if document["role"] else None,
                created_at=document["created_at"].isoformat(),
                updated_at=document["updated_at"].isoformat(),
            )
            for document in documents
        ]

        return Pagination[AdminUserView](
            items=result,
            page=page,
            page_size=page_size,
            item_count=len(result),
            total_items=total_items,
            total_pages=total_pages,
        )

    # Insert document
    async def insert_item(self, document: dict) -> InsertOneResult:
        return await self.collection.insert_one(document)

    async def insert_items(self, documents: list[dict]) -> InsertManyResult:
        pass

    # Update document
    async def update_by_id(self, id: ObjectId, document: dict) -> UpdateResult:
        return await self.collection.update_one({"_id": id}, {"$set": document})

    # Delete document
    async def delete_by_id(self, id: ObjectId, document: dict) -> DeleteResult:
        pass
