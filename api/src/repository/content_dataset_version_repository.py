from datetime import datetime

from core.dependency import PostgresDB
from model.content_dataset_version_model import ContentDatasetVersionModel
from sqlalchemy import select


class ContentDatasetVersionRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_key(self, key: str) -> ContentDatasetVersionModel | None:
        return (await self.context.scalars(select(ContentDatasetVersionModel).where(ContentDatasetVersionModel.key_query == key, ContentDatasetVersionModel.deleted_at.is_(None)))).first()

    async def upsert(self, key_query: str, etag: str, updated_at: datetime) -> ContentDatasetVersionModel:
        model = await self.find_by_key(key_query)
        if model is None:
            model = ContentDatasetVersionModel(key_query=key_query, etag=etag)
            self.context.add(model)
        else:
            model.etag = etag
            model.updated_at = updated_at
        await self.context.commit()
        await self.context.refresh(model)
        return model
