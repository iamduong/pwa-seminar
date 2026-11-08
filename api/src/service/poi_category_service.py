from core.dependency import PostgresDB
from core.pagination import Pagination
from repository.poi_category_repository import PoiCategoryRepository
from schema.poi_category_schema import FilterPoiCategory, ViewPoiCategory


class PoiCategoryService:
    def __init__(self, db: PostgresDB):
        self.repository = PoiCategoryRepository(db)

    async def filter_poi_category(self, filters: FilterPoiCategory):
        items, total = await self.repository.find_pagination(filters.page, filters.page_size, filters.q)
        return Pagination[ViewPoiCategory](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[ViewPoiCategory(id=str(x.id), name=x.name) for x in items])
