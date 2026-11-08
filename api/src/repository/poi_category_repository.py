from core.dependency import PostgresDB
from model.poi_category_model import PoiCategoryModel
from sqlalchemy import func, select


class PoiCategoryRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(self, category_id):
        return (await self.context.scalars(select(PoiCategoryModel).where(PoiCategoryModel.id == category_id, PoiCategoryModel.deleted_at.is_(None)))).one_or_none()

    async def find_pagination(self, page: int, page_size: int, keyword: str | None = None):
        conditions = [PoiCategoryModel.deleted_at.is_(None), PoiCategoryModel.is_active.is_(True)]
        if keyword:
            conditions.append(PoiCategoryModel.name.ilike(f"%{keyword.strip()}%"))
        items = await self.context.scalars(select(PoiCategoryModel).where(*conditions).order_by(PoiCategoryModel.name).offset((page - 1) * page_size).limit(page_size))
        total = await self.context.scalar(select(func.count()).select_from(PoiCategoryModel).where(*conditions))
        return list(items.all()), total or 0
