from datetime import datetime

from model.content_dataset_version_model import ContentDatasetVersionModel
from pymongo import ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase


class ContentDatasetVersionRepository:
    def __init__(self, db: AsyncDatabase):
        self.collection = db["content_dataset_version"]

    async def implement_index(self) -> None:
        await self.collection.create_index("key_query", unique=True)

    async def find_one(self, search: dict) -> ContentDatasetVersionModel | None:
        document = await self.collection.find_one(search)

        if document is None:
            return None

        return ContentDatasetVersionModel.model_validate(document)

    async def upsert(
        self,
        key_query: str,
        etag: str,
        updated_at: datetime,
    ) -> ContentDatasetVersionModel:
        document = await self.collection.find_one_and_update(
            {"key_query": key_query},
            {
                "$set": {
                    "etag": etag,
                    "updated_at": updated_at,
                    "deleted_at": None,
                },
                "$setOnInsert": {
                    "key_query": key_query,
                    "created_at": updated_at,
                },
            },
            # Allow insert document if not exists
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )

        return ContentDatasetVersionModel.model_validate(document)
