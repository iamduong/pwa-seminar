from datetime import datetime
from uuid import UUID

from core.dependency import PostgresDB
from model.poi_task_model import PoiTaskModel
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload


class PoiTaskRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    @staticmethod
    def _options():
        return (selectinload(PoiTaskModel.events), selectinload(PoiTaskModel.processes))

    async def find_by_id(self, task_id: UUID):
        return (await self.context.scalars(select(PoiTaskModel).options(*self._options()).where(PoiTaskModel.id == task_id, PoiTaskModel.deleted_at.is_(None)))).one_or_none()

    async def find_pagination(self, page: int, page_size: int, statuses: list[str] | None = None):
        conditions = [PoiTaskModel.deleted_at.is_(None)]
        if statuses:
            conditions.append(PoiTaskModel.status.in_(statuses))
        tasks = await self.context.scalars(select(PoiTaskModel).options(*self._options()).where(*conditions).order_by(PoiTaskModel.updated_at.desc()).offset((page - 1) * page_size).limit(page_size))
        total = await self.context.scalar(select(func.count()).select_from(PoiTaskModel).where(*conditions))
        return list(tasks.all()), total or 0

    async def find_updated_after(self, updated_after: datetime):
        result = await self.context.scalars(select(PoiTaskModel).options(*self._options()).where(PoiTaskModel.updated_at > updated_after, PoiTaskModel.deleted_at.is_(None)).order_by(PoiTaskModel.updated_at))
        return list(result.all())

    async def insert(self, task):
        self.context.add(task)
        await self.context.flush()
        return task

    async def save(self, task):
        task = await self.context.merge(task)
        await self.context.commit()
        return await self.find_by_id(task.id)
