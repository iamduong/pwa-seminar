from datetime import datetime
from uuid import UUID

from core.dependency import PostgresDB
from model.poi_localization_model import PoiLocalizationModel
from model.poi_model import PoiModel
from sqlalchemy import func, or_, select


def attach_location(model):
    model.location_geojson = model.location or {"type": "Point", "coordinates": [0, 0]}
    return model


class PoiRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(self, poi_id: UUID, *, active: bool | None = None) -> PoiModel | None:
        conditions = [PoiModel.id == poi_id, PoiModel.deleted_at.is_(None)]
        if active is not None:
            conditions.append(PoiModel.is_active == active)
        model = (await self.context.scalars(select(PoiModel).where(*conditions))).first()
        return attach_location(model) if model else None

    async def find_owned(self, owner_id: UUID, poi_id: UUID | None = None) -> list[PoiModel]:
        conditions = [PoiModel.owner_id == owner_id, PoiModel.deleted_at.is_(None)]
        if poi_id is not None:
            conditions.append(PoiModel.id == poi_id)
        models = (await self.context.scalars(select(PoiModel).where(*conditions).order_by(PoiModel.name))).all()
        return [attach_location(model) for model in models]

    async def find_pagination(self, page: int, page_size: int, *, owner_id: UUID | None = None, keyword: str | None = None):
        conditions = [PoiModel.deleted_at.is_(None)]
        if owner_id is not None:
            conditions.append(PoiModel.owner_id == owner_id)
        if keyword:
            pattern = f"%{keyword.strip()}%"
            conditions.append(or_(PoiModel.name.ilike(pattern), PoiModel.address.ilike(pattern)))
        models = (await self.context.scalars(select(PoiModel).where(*conditions).order_by(PoiModel.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).all()
        total = await self.context.scalar(select(func.count()).select_from(PoiModel).where(*conditions))
        return [attach_location(model) for model in models], total or 0

    async def find_public_changed(self, lang: str, updated_after: datetime | None):
        conditions = [PoiModel.is_active.is_(True), PoiModel.deleted_at.is_(None)]
        if updated_after is not None:
            conditions.append(PoiModel.updated_at > updated_after)
        statement = (
            select(PoiModel, PoiLocalizationModel)
            .join(PoiLocalizationModel, (PoiLocalizationModel.poi_id == PoiModel.id) & (PoiLocalizationModel.lang == lang), isouter=True)
            .where(*conditions).order_by(PoiModel.updated_at, PoiModel.id)
        )
        return list((await self.context.execute(statement)).all())

    async def insert(self, poi: PoiModel) -> PoiModel:
        self.context.add(poi)
        await self.context.flush()
        return poi

    async def list_admin(self, page: int, page_size: int, keyword: str | None = None):
        return await self.find_pagination(page, page_size, keyword=keyword)
