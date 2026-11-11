from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from fastapi import HTTPException
from repository.owner_notification_repository import OwnerNotificationRepository
from schema.owner_notification_schema import FilterOwnerNotification, ViewOwnerNotification


class OwnerNotificationService:
    def __init__(self, db: PostgresDB):
        self.repository = OwnerNotificationRepository(db)

    @staticmethod
    def _view(model) -> ViewOwnerNotification:
        return ViewOwnerNotification(
            id=str(model.id),
            notification_type=model.notification_type,
            title=model.title,
            message=model.message,
            resource_type=model.resource_type,
            resource_id=str(model.resource_id),
            is_read=model.is_read,
            read_at=model.read_at,
            created_at=model.created_at,
        )

    async def filter_self(self, user_id: str, filters: FilterOwnerNotification):
        items, total = await self.repository.find_pagination(
            parse_uuid(user_id, "Mã người dùng"),
            filters.page,
            filters.page_size,
        )
        return Pagination[ViewOwnerNotification](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._view(item) for item in items],
        )

    async def count_unread(self, user_id: str) -> int:
        return await self.repository.count_unread(parse_uuid(user_id, "Mã người dùng"))

    async def mark_read(self, user_id: str, notification_id: str):
        notification = await self.repository.mark_read(
            parse_uuid(user_id, "Mã người dùng"),
            parse_uuid(notification_id, "Mã thông báo"),
        )
        if notification is None:
            raise HTTPException(404, "Không tìm thấy thông báo")
        return self._view(notification)

    async def mark_all_read(self, user_id: str) -> None:
        await self.repository.mark_all_read(parse_uuid(user_id, "Mã người dùng"))
