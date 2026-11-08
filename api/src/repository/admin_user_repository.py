from datetime import UTC, datetime
from uuid import UUID

from core.dependency import PostgresDB
from model.admin_user_model import AdminUserModel
from sqlalchemy import func, or_, select, update


class AdminUserRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(self, id: UUID) -> AdminUserModel | None:
        statement = select(AdminUserModel).where(
            AdminUserModel.id == id, AdminUserModel.deleted_at.is_(None)
        )

        result = await self.context.scalars(statement)

        return result.one_or_none()

    async def find_by_email_or_phone(self, email: str, phone: str) -> AdminUserModel | None:
        result = await self.context.scalars(
            select(AdminUserModel).where(
                AdminUserModel.deleted_at.is_(None),
                or_(AdminUserModel.email == email, AdminUserModel.phone == phone),
            )
        )
        return result.first()

    async def find_by_identifier(self, identifier: str) -> AdminUserModel | None:
        result = await self.context.scalars(
            select(AdminUserModel).where(
                AdminUserModel.deleted_at.is_(None),
                or_(AdminUserModel.email == identifier.lower(), AdminUserModel.phone == identifier),
            )
        )
        return result.first()

    async def find_pagination(
        self, page: int, page_size: int, *, keyword: str | None = None,
        is_active: bool | None = None, is_poi_owner_verified: bool | None = None,
    ) -> tuple[list[AdminUserModel], int]:
        conditions = [AdminUserModel.deleted_at.is_(None)]
        if keyword:
            pattern = f"%{keyword.strip()}%"
            conditions.append(or_(AdminUserModel.full_name.ilike(pattern), AdminUserModel.email.ilike(pattern), AdminUserModel.phone.ilike(pattern)))
        if is_active is not None:
            conditions.append(AdminUserModel.is_active == is_active)
        if is_poi_owner_verified is not None:
            conditions.append(AdminUserModel.is_poi_owner_verified == is_poi_owner_verified)
        items = await self.context.scalars(
            select(AdminUserModel).where(*conditions).order_by(AdminUserModel.full_name, AdminUserModel.id).offset((page - 1) * page_size).limit(page_size)
        )
        total = await self.context.scalar(select(func.count()).select_from(AdminUserModel).where(*conditions))
        return list(items.all()), total or 0

    async def update(self, model: AdminUserModel) -> AdminUserModel:
        managed_model = await self.context.merge(model)
        await self.context.commit()
        await self.context.refresh(managed_model)

        return managed_model

    udpate = update

    async def insert(self, model: AdminUserModel) -> AdminUserModel:
        self.context.add(model)
        await self.context.commit()
        await self.context.refresh(model)

        return model

    async def soft_delete(self, id: UUID) -> AdminUserModel | None:
        statement = (
            update(AdminUserModel)
            .where(
                AdminUserModel.id == id,
                AdminUserModel.deleted_at.is_(None),
            )
            .values(deleted_at=datetime.now(UTC))
            .returning(AdminUserModel)
        )
        result = await self.context.scalars(statement)
        deleted_model = result.one_or_none()

        await self.context.commit()
        return deleted_model
