from datetime import UTC, datetime
from uuid import uuid4

from core.dependency import PostgresDB
from repository.content_dataset_version_repository import ContentDatasetVersionRepository


class ContentDatasetVersionService:
    POI_KEY_QUERY = "poi"

    def __init__(self, db: PostgresDB):
        self.repository = ContentDatasetVersionRepository(db)

    async def initialize(self):
        return await self.find_poi_version() or await self.rotate_poi_etag()

    async def find_poi_version(self):
        return await self.repository.find_by_key(self.POI_KEY_QUERY)

    async def check_poi_etag(self, etag: str | None):
        version = await self.find_poi_version()
        return etag is not None and version is not None and version.etag == etag

    async def rotate_poi_etag(self):
        return await self.repository.upsert(self.POI_KEY_QUERY, uuid4().hex, datetime.now(UTC))
