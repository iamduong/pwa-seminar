from datetime import UTC, datetime
from uuid import UUID

from core.dependency import PostgresDB
from model.role_model import RoleModel
from sqlalchemy import func, select


class RoleRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_id(self, role_id: UUID, *, deleted: bool = False) -> RoleModel | None:
        condition = RoleModel.deleted_at.is_not(None) if deleted else RoleModel.deleted_at.is_(None)
        return (await self.context.scalars(select(RoleModel).where(RoleModel.id == role_id, condition))).one_or_none()

    async def find_by_name(self, name: str, *, system_only: bool = False, exclude_id: UUID | None = None) -> RoleModel | None:
        conditions = [RoleModel.name == name, RoleModel.deleted_at.is_(None)]
        if system_only:
            conditions.append(RoleModel.is_system.is_(True))
        if exclude_id is not None:
            conditions.append(RoleModel.id != exclude_id)
        return (await self.context.scalars(select(RoleModel).where(*conditions))).first()

    async def find_pagination(self, page: int, page_size: int, *, keyword: str | None, deleted: bool) -> tuple[list[RoleModel], int]:
        conditions = [RoleModel.deleted_at.is_not(None) if deleted else RoleModel.deleted_at.is_(None)]
        if keyword:
            conditions.append(RoleModel.name.ilike(f"%{keyword.strip()}%"))
        result = await self.context.scalars(select(RoleModel).where(*conditions).order_by(RoleModel.priority, RoleModel.id).offset((page - 1) * page_size).limit(page_size))
        total = await self.context.scalar(select(func.count()).select_from(RoleModel).where(*conditions))
        return list(result.all()), total or 0

    async def count_assigned_users(self, role_id: UUID) -> int:
        from model.admin_user_model import AdminUserModel
        return (await self.context.scalar(select(func.count()).select_from(AdminUserModel).where(AdminUserModel.role_id == role_id, AdminUserModel.deleted_at.is_(None)))) or 0

    async def save(self, role: RoleModel) -> RoleModel:
        role = await self.context.merge(role)
        await self.context.commit()
        await self.context.refresh(role)
        return role

    async def insert(self, role: RoleModel) -> RoleModel:
        self.context.add(role)
        await self.context.commit()
        await self.context.refresh(role)
        return role

    async def soft_delete(self, role: RoleModel) -> None:
        role.deleted_at = datetime.now(UTC)
        await self.context.commit()

    async def restore(self, role: RoleModel) -> RoleModel:
        role.deleted_at = None
        role.updated_at = datetime.now(UTC)
        await self.context.commit()
        await self.context.refresh(role)
        return role
