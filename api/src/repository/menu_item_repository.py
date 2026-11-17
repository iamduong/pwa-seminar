from uuid import UUID

from core.dependency import PostgresDB
from model.menu_item_localization_model import MenuItemLocalizationModel
from model.menu_item_model import MenuItemModel
from sqlalchemy import case, delete, func, select
from sqlalchemy.orm import selectinload


class MenuItemRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(self, item_id: UUID, *, for_update: bool = False) -> MenuItemModel | None:
        statement = select(MenuItemModel).where(MenuItemModel.id == item_id, MenuItemModel.deleted_at.is_(None))
        if for_update:
            statement = statement.with_for_update().execution_options(populate_existing=True)
        return (await self.context.scalars(statement)).one_or_none()

    async def clear_localizations(self, item_id: UUID) -> None:
        await self.context.execute(delete(MenuItemLocalizationModel).where(MenuItemLocalizationModel.menu_item_id == item_id))

    async def queue_translations(self, item: MenuItemModel, languages: list[str]) -> None:
        await self.clear_localizations(item.id)
        self.context.add_all([
            MenuItemLocalizationModel(menu_item_id=item.id, lang=lang, name=item.name, description=item.description, translation_status="pending")
            for lang in languages
        ])

    async def find_localizations(self, item_id: UUID):
        return list((await self.context.scalars(select(MenuItemLocalizationModel).where(MenuItemLocalizationModel.menu_item_id == item_id, MenuItemLocalizationModel.deleted_at.is_(None)).order_by(MenuItemLocalizationModel.lang))).all())

    async def find_public(self, poi_id: UUID, lang: str):
        return (await self.context.execute(
            select(MenuItemModel, MenuItemLocalizationModel)
            .join(MenuItemLocalizationModel, MenuItemLocalizationModel.menu_item_id == MenuItemModel.id)
            .where(MenuItemModel.poi_id == poi_id, MenuItemModel.deleted_at.is_(None), MenuItemModel.is_active.is_(True), MenuItemModel.is_available.is_(True), MenuItemLocalizationModel.lang == lang, MenuItemLocalizationModel.deleted_at.is_(None), MenuItemLocalizationModel.translation_status == "ready")
            .order_by(MenuItemModel.created_at.desc(), MenuItemModel.id.desc())
        )).all()

    async def find_all_public(self, lang: str):
        return (await self.context.execute(
            select(MenuItemModel, MenuItemLocalizationModel)
            .join(MenuItemLocalizationModel, MenuItemLocalizationModel.menu_item_id == MenuItemModel.id)
            .where(
                MenuItemModel.deleted_at.is_(None),
                MenuItemModel.is_active.is_(True),
                MenuItemModel.is_available.is_(True),
                MenuItemLocalizationModel.lang == lang,
                MenuItemLocalizationModel.deleted_at.is_(None),
                MenuItemLocalizationModel.translation_status == "ready",
            )
            .order_by(MenuItemModel.created_at.desc(), MenuItemModel.id.desc())
        )).all()

    async def find_translation_tasks(self, page: int, page_size: int, status: str | None):
        localization = MenuItemLocalizationModel
        def has_status(value):
            return MenuItemModel.localizations.any(localization.deleted_at.is_(None) & (localization.translation_status == value))

        task_status = case(
            (has_status("processing"), "running"),
            (has_status("pending"), "queued"),
            (has_status("failed"), "failed"),
            else_="done",
        )
        conditions = [MenuItemModel.deleted_at.is_(None), MenuItemModel.is_active.is_(True), MenuItemModel.localizations.any(localization.deleted_at.is_(None))]
        if status:
            conditions.append(task_status == status)
        items = list((await self.context.scalars(
            select(MenuItemModel).options(selectinload(MenuItemModel.localizations))
            .where(*conditions).order_by(MenuItemModel.updated_at.desc(), MenuItemModel.id.desc())
            .offset((page - 1) * page_size).limit(page_size)
        )).all())
        total = await self.context.scalar(select(func.count()).select_from(MenuItemModel).where(*conditions))
        return items, total or 0

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
