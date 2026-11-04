import re

from bson import ObjectId
from core.dependency import MongoDB
from core.pagination import Pagination
from model.poi_model import PoiModel
from repository.poi_repository import PoiRepository
from schema.poi_schema import FilterOwnerPoi, ViewOwnerPoi


class PoiService:
    def __init__(self, db: MongoDB):
        self.poi_repository = PoiRepository(db)

    def _to_owner_view(self, model: PoiModel) -> ViewOwnerPoi:
        return ViewOwnerPoi(
            id=str(model.id),
            category_id=str(model.category_id),
            category_name=model.category_name,
            name=model.name,
            description=model.description,
            address=model.address,
            location=model.location,
            images=model.images,
            trigger_radius=model.trigger_radius,
            is_active=model.is_active,
            activation_requested=model.activation_requested,
            audio_priority=model.audio_priority,
            audio_status=model.audio_status,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def filter_owner_pois(
        self, filters: FilterOwnerPoi, owner_id: str
    ) -> Pagination[ViewOwnerPoi]:
        conditions: list[dict] = [
            {"owner_id": ObjectId(owner_id)},
            {"deleted_at": None},
        ]

        if filters.q:
            keyword = re.escape(filters.q.strip())
            if keyword:
                conditions.append(
                    {
                        "$or": [
                            {"name": {"$regex": keyword, "$options": "i"}},
                            {"address": {"$regex": keyword, "$options": "i"}},
                        ]
                    }
                )

        pipeline = [{"$match": {"$and": conditions}}]
        total_item = await self.poi_repository.count_filter(pipeline)
        pois = await self.poi_repository.find_pagination(
            pipeline, filters.page, filters.page_size
        )
        total_page = (total_item + filters.page_size - 1) // filters.page_size

        return Pagination[ViewOwnerPoi](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[self._to_owner_view(poi) for poi in pois],
        )
