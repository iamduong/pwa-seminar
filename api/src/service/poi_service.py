from datetime import datetime

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from repository.poi_repository import PoiRepository
from schema.poi_dataset_schema import PoiDatasetItem
from schema.poi_schema import FilterOwnerPoi, ViewOwnerPoi


class PoiService:
    def __init__(self, db: PostgresDB):
        self.repository = PoiRepository(db)

    @staticmethod
    def _owner_view(model):
        return ViewOwnerPoi(id=str(model.id), category_id=str(model.category_id), category_name=model.category_name, name=model.name, description=model.description, address=model.address, location=model.location_geojson, images=model.images, trigger_radius=model.trigger_radius, is_active=model.is_active, activation_requested=model.activation_requested, audio_priority=model.audio_priority, audio_status=model.audio_status, created_at=model.created_at, updated_at=model.updated_at)

    async def filter_owner_pois(self, filters: FilterOwnerPoi, owner_id: str):
        items, total = await self.repository.find_pagination(filters.page, filters.page_size, owner_id=parse_uuid(owner_id, "Mã chủ quán"), keyword=filters.q)
        return Pagination[ViewOwnerPoi](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._owner_view(x) for x in items])

    async def find_public_pois_changed_between(self, lang: str, updated_after: datetime | None):
        rows = await self.repository.find_public_changed(lang, updated_after)
        result = []
        for poi, localization in rows:
            result.append(PoiDatasetItem(id=str(poi.id), category_id=str(poi.category_id), category_name=localization.category if localization else poi.category_name, name=localization.name if localization else poi.name, description=localization.description if localization else poi.description, address=poi.address, location=poi.location, images=poi.images, trigger_radius=poi.trigger_radius, audio_priority=poi.audio_priority, audio_status=localization.audio_status if localization else poi.audio_status, audio_url=localization.audio_url if localization else None, lang=lang, created_at=poi.created_at, updated_at=poi.updated_at))
        return result
