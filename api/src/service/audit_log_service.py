from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from repository.audit_log_repository import AuditLogRepository
from schema.audit_log_schema import FilterAuditLog, ViewAuditLog


class AuditLogService:
    def __init__(self, db: PostgresDB):
        self.repository = AuditLogRepository(db)

    @staticmethod
    def _view(model) -> ViewAuditLog:
        return ViewAuditLog(
            id=str(model.id),
            actor_user_id=str(model.actor_user_id) if model.actor_user_id else None,
            action=model.action,
            resource_type=model.resource_type,
            resource_id=str(model.resource_id) if model.resource_id else None,
            result=model.result,
            description=model.description,
            metadata=model.audit_metadata,
            created_at=model.created_at,
        )

    async def filter_logs(self, filters: FilterAuditLog):
        actor_id = (
            parse_uuid(filters.actor_user_id, "Mã người thực hiện")
            if filters.actor_user_id
            else None
        )
        items, total = await self.repository.find_pagination(
            filters.page,
            filters.page_size,
            actor_user_id=actor_id,
            action=filters.action,
            resource_type=filters.resource_type,
        )
        return Pagination[ViewAuditLog](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._view(item) for item in items],
        )
