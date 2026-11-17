from datetime import UTC, datetime
from uuid import uuid4

from core.dependency import PostgresDB
from repository.content_dataset_version_repository import ContentDatasetVersionRepository


class ContentDatasetVersionService:
    POI_KEY_QUERY = "poi"
    MENU_ITEM_KEY_QUERY = "menu_item"

    def __init__(self, db: PostgresDB):
        self.repository = ContentDatasetVersionRepository(db)

    async def initialize(self):
        poi_version = await self.find_poi_version() or await self.rotate_poi_etag()
        menu_item_version = (
            await self.find_menu_item_version() or await self.rotate_menu_item_etag()
        )
        return poi_version, menu_item_version

    async def find_poi_version(self):
        return await self.repository.find_by_key(self.POI_KEY_QUERY)

    async def check_poi_etag(self, etag: str | None):
        version = await self.find_poi_version()
        return etag is not None and version is not None and version.etag == etag

    async def rotate_poi_etag(self):
        return await self.repository.upsert(self.POI_KEY_QUERY, uuid4().hex, datetime.now(UTC))

    async def find_menu_item_version(self):
        return await self.repository.find_by_key(self.MENU_ITEM_KEY_QUERY)

    async def check_menu_item_etag(self, etag: str | None):
        version = await self.find_menu_item_version()
        return etag is not None and version is not None and version.etag == etag

    async def rotate_menu_item_etag(self):
        return await self.repository.upsert(
            self.MENU_ITEM_KEY_QUERY,
            uuid4().hex,
            datetime.now(UTC),
        )
