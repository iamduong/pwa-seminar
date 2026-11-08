import re

from core.dependency import MongoDB
from core.pagination import Pagination
from model.poi_category_model import PoiCategoryModel
from repository.poi_category_repository import PoiCategoryRepository
from schema.poi_category_schema import FilterPoiCategory, ViewPoiCategory


class PoiCategoryService:
    def __init__(self, db: MongoDB):
        self.poi_category_repository = PoiCategoryRepository(db)

    def _to_view(self, model: PoiCategoryModel) -> ViewPoiCategory:
        return ViewPoiCategory(id=str(model.id), name=model.name)

    async def filter_poi_category(
        self, filters: FilterPoiCategory
    ) -> Pagination[ViewPoiCategory]:
        pipeline: list[dict] = []

        if filters.q is not None:
            keyword = filters.q.strip()
            pipeline.append(
                {
                    "$match": {
                        "name": {
                            "$regex": re.escape(keyword),
                            "$options": "i",
                        },
                        "deleted_at": None,
                    }
                }
            )

        total_item = await self.poi_category_repository.count_filter(pipeline)
        poi_categories = await self.poi_category_repository.find_pagination(
            pipeline=pipeline, page=filters.page, page_size=filters.page_size
        )

        total_page = (total_item + filters.page_size - 1) // filters.page_size

        return Pagination[ViewPoiCategory](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[self._to_view(poi_category) for poi_category in poi_categories],
        )
