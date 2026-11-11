from uuid import UUID

from core.dependency import PostgresDB
from model.audit_log_model import AuditLogModel
from sqlalchemy import func, select


class AuditLogRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def create(
        self,
        *,
        actor_user_id: UUID | None,
        action: str,
        resource_type: str,
        resource_id: UUID | None,
        description: str | None = None,
        metadata: dict | None = None,
        result: str = "success",
        commit: bool = True,
    ) -> AuditLogModel:
        log = AuditLogModel(
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            result=result,
            description=description,
            audit_metadata=metadata or {},
        )
        self.context.add(log)
        await self.context.flush()
        if commit:
            await self.context.commit()
            await self.context.refresh(log)
        return log

    async def find_pagination(
        self,
        page: int,
        page_size: int,
        *,
        actor_user_id: UUID | None = None,
        action: str | None = None,
        resource_type: str | None = None,
    ):
        conditions = [AuditLogModel.deleted_at.is_(None)]
        if actor_user_id is not None:
            conditions.append(AuditLogModel.actor_user_id == actor_user_id)
        if action:
            conditions.append(AuditLogModel.action == action)
        if resource_type:
            conditions.append(AuditLogModel.resource_type == resource_type)
        items = await self.context.scalars(
            select(AuditLogModel)
            .where(*conditions)
            .order_by(AuditLogModel.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        total = await self.context.scalar(
            select(func.count()).select_from(AuditLogModel).where(*conditions)
        )
        return list(items.all()), total or 0
