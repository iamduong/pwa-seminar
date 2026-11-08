from uuid import UUID

from core.dependency import PostgresDB
from model.menu_item_model import MenuItemModel
from sqlalchemy import func, select


class MenuItemRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(self, item_id: UUID) -> MenuItemModel | None:
        return (await self.context.scalars(select(MenuItemModel).where(MenuItemModel.id == item_id, MenuItemModel.deleted_at.is_(None)))).one_or_none()

    async def find_pending_duplicate(self, poi_id: UUID, name: str) -> MenuItemModel | None:
        return (await self.context.scalars(select(MenuItemModel).where(MenuItemModel.poi_id == poi_id, func.lower(MenuItemModel.name) == name.lower(), MenuItemModel.is_active.is_(False), MenuItemModel.deleted_at.is_(None)))).first()

    async def find_many(self, *, poi_ids: list[UUID] | None = None, poi_id: UUID | None = None, is_active: bool | None = None, is_available: bool | None = None, keyword: str | None = None, offset: int = 0, limit: int | None = None):
        conditions = [MenuItemModel.deleted_at.is_(None)]
        if poi_ids is not None:
            conditions.append(MenuItemModel.poi_id.in_(poi_ids))
        if poi_id is not None:
            conditions.append(MenuItemModel.poi_id == poi_id)
        if is_active is not None:
            conditions.append(MenuItemModel.is_active == is_active)
        if is_available is not None:
            conditions.append(MenuItemModel.is_available == is_available)
        if keyword:
            conditions.append(MenuItemModel.name.ilike(f"%{keyword.strip()}%"))
        statement = select(MenuItemModel).where(*conditions).order_by(MenuItemModel.created_at.desc(), MenuItemModel.id.desc()).offset(offset)
        if limit is not None:
            statement = statement.limit(limit)
        return list((await self.context.scalars(statement)).all())

    async def count(self, *, poi_id: UUID, is_active: bool | None = None, keyword: str | None = None) -> int:
        conditions = [MenuItemModel.poi_id == poi_id, MenuItemModel.deleted_at.is_(None)]
        if is_active is not None:
            conditions.append(MenuItemModel.is_active == is_active)
        if keyword:
            conditions.append(MenuItemModel.name.ilike(f"%{keyword.strip()}%"))
        return (await self.context.scalar(select(func.count()).select_from(MenuItemModel).where(*conditions))) or 0

    async def insert(self, item: MenuItemModel) -> MenuItemModel:
        self.context.add(item)
        await self.context.commit()
        await self.context.refresh(item)
        return item

    async def save(self, item: MenuItemModel) -> MenuItemModel:
        item = await self.context.merge(item)
        await self.context.commit()
        await self.context.refresh(item)
        return item
