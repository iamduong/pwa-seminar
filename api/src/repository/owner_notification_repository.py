from datetime import UTC, datetime
from uuid import UUID

from core.dependency import PostgresDB
from model.owner_notification_model import OwnerNotificationModel
from sqlalchemy import func, select, update


class OwnerNotificationRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def create_once(
        self,
        *,
        owner_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        resource_type: str,
        resource_id: UUID,
        commit: bool = True,
    ) -> OwnerNotificationModel:
        existing = (
            await self.context.scalars(
                select(OwnerNotificationModel).where(
                    OwnerNotificationModel.owner_id == owner_id,
                    OwnerNotificationModel.notification_type == notification_type,
                    OwnerNotificationModel.resource_id == resource_id,
                )
            )
        ).first()
        if existing is not None:
            return existing

        notification = OwnerNotificationModel(
            owner_id=owner_id,
            notification_type=notification_type,
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
        )
        self.context.add(notification)
        await self.context.flush()
        if commit:
            await self.context.commit()
            await self.context.refresh(notification)
        return notification

    async def find_pagination(self, owner_id: UUID, page: int, page_size: int):
        conditions = [
            OwnerNotificationModel.owner_id == owner_id,
            OwnerNotificationModel.deleted_at.is_(None),
        ]
        items = await self.context.scalars(
            select(OwnerNotificationModel)
            .where(*conditions)
            .order_by(OwnerNotificationModel.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        total = await self.context.scalar(
            select(func.count()).select_from(OwnerNotificationModel).where(*conditions)
        )
        return list(items.all()), total or 0

    async def count_unread(self, owner_id: UUID) -> int:
        value = await self.context.scalar(
            select(func.count()).select_from(OwnerNotificationModel).where(
                OwnerNotificationModel.owner_id == owner_id,
                OwnerNotificationModel.is_read.is_(False),
                OwnerNotificationModel.deleted_at.is_(None),
            )
        )
        return value or 0

    async def mark_read(self, owner_id: UUID, notification_id: UUID):
        notification = (
            await self.context.scalars(
                select(OwnerNotificationModel).where(
                    OwnerNotificationModel.id == notification_id,
                    OwnerNotificationModel.owner_id == owner_id,
                    OwnerNotificationModel.deleted_at.is_(None),
                )
            )
        ).one_or_none()
        if notification is None:
            return None
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(UTC)
            await self.context.commit()
            await self.context.refresh(notification)
        return notification

    async def mark_all_read(self, owner_id: UUID) -> None:
        await self.context.execute(
            update(OwnerNotificationModel)
            .where(
                OwnerNotificationModel.owner_id == owner_id,
                OwnerNotificationModel.is_read.is_(False),
                OwnerNotificationModel.deleted_at.is_(None),
            )
            .values(is_read=True, read_at=datetime.now(UTC))
        )
        await self.context.commit()
