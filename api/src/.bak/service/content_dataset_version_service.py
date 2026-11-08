from datetime import UTC, datetime
from uuid import uuid4

from core.dependency import MongoDB
from model.content_dataset_version_model import ContentDatasetVersionModel
from repository.content_dataset_version_repository import (
    ContentDatasetVersionRepository,
)


class ContentDatasetVersionService:
    POI_KEY_QUERY = "poi"

    def __init__(self, db: MongoDB):
        self.repository = ContentDatasetVersionRepository(db)

    async def initialize(self) -> ContentDatasetVersionModel:
        # Init index for key_query
        await self.repository.implement_index()
        version = await self.find_poi_version()

        if version is not None:
            return version

        return await self.rotate_poi_etag()

    async def find_poi_version(self) -> ContentDatasetVersionModel | None:
        return await self.repository.find_one(
            {
                "key_query": self.POI_KEY_QUERY,
                "deleted_at": None,
            }
        )

    async def check_poi_etag(self, etag: str | None) -> bool:
        if etag is None:
            return False

        version = await self.find_poi_version()
        return version is not None and version.etag == etag

    async def rotate_poi_etag(self) -> ContentDatasetVersionModel:
        return await self.repository.upsert(
            key_query=self.POI_KEY_QUERY,
            etag=uuid4().hex,
            updated_at=datetime.now(UTC),
        )
