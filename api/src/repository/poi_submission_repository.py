from uuid import UUID

from core.dependency import PostgresDB
from model.poi_submission_model import PoiSubmissionModel
from sqlalchemy import func, or_, select


def _attach_location(model):
    model.location_geojson = model.location or {"type": "Point", "coordinates": [0, 0]}
    return model


class PoiSubmissionRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(self, submission_id: UUID, *, pending: bool = False):
        conditions = [PoiSubmissionModel.id == submission_id, PoiSubmissionModel.deleted_at.is_(None)]
        if pending:
            conditions.append(PoiSubmissionModel.status == "pending")
        model = (await self.context.scalars(select(PoiSubmissionModel).where(*conditions))).first()
        return _attach_location(model) if model else None

    async def find_pagination(self, page: int, page_size: int, *, owner_id: UUID | None = None, keyword: str | None = None, address: str | None = None, category_id: UUID | None = None, status: str | None = None):
        conditions = [PoiSubmissionModel.deleted_at.is_(None)]
        if owner_id is not None:
            conditions.append(PoiSubmissionModel.owner_id == owner_id)
        if keyword:
            pattern = f"%{keyword.strip()}%"
            conditions.append(or_(PoiSubmissionModel.name.ilike(pattern), PoiSubmissionModel.address.ilike(pattern)))
        if address:
            conditions.append(PoiSubmissionModel.address.ilike(f"%{address.strip()}%"))
        if category_id is not None:
            conditions.append(PoiSubmissionModel.category_id == category_id)
        if status:
            conditions.append(PoiSubmissionModel.status == status)
        models = (await self.context.scalars(select(PoiSubmissionModel).where(*conditions).order_by(PoiSubmissionModel.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).all()
        total = await self.context.scalar(select(func.count()).select_from(PoiSubmissionModel).where(*conditions))
        return [_attach_location(model) for model in models], total or 0

    async def insert(self, model):
        self.context.add(model)
        await self.context.commit()
        await self.context.refresh(model)
        return model

    async def save(self, model):
        model = await self.context.merge(model)
        await self.context.commit()
        await self.context.refresh(model)
        return model
