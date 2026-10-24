import re

from core.dependency import MongoDB
from core.pagination import Pagination
from repository.poi_category_repository import PoiCategoryRepository
from schema.poi_category_schema import FilterPoiCategory, ViewPoiCategory


class PoiCategoryService:
    def __init__(self, db: MongoDB):
        self.poi_category_repository = PoiCategoryRepository(db)

    async def filter_poi_category(
        self, params: FilterPoiCategory
    ) -> Pagination[ViewPoiCategory]:
        search: dict = {}
        search["deleted_at"] = None

        if params.q is not None:
            keyword = params.q.strip()
            search["name"] = {
                "$regex": re.escape(keyword),
                "$options": "i",
            }

        result = await self.poi_category_repository.find_pagination(
            page=params.page, page_size=params.page_size, search=search
        )

        return result
