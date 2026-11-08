from uuid import UUID

from model.role_model import RoleModel
from sqlalchemy.ext.asyncio import AsyncSession


class RoleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, role_id: UUID) -> RoleModel | None:
        """Get one active role by its UUID."""
        role = await self.session.get(RoleModel, role_id)

        if role is not None and role.deleted_at is not None:
            return None

        return role

    async def add(self, role: RoleModel) -> RoleModel:
        """Add and persist a new role."""
        self.session.add(role)
        await self.session.commit()
        return role

    async def update(
        self,
        role_id: UUID,
        *,
        name: str | None = None,
        permissions: list[str] | None = None,
        is_system: bool | None = None,
        priority: int | None = None,
    ) -> RoleModel | None:
        """Update and persist an active role."""
        role = await self.get_by_id(role_id)

        if role is None:
            return None

        if name is not None:
            role.name = name
        if permissions is not None:
            role.permissions = permissions
        if is_system is not None:
            role.is_system = is_system
        if priority is not None:
            role.priority = priority

        await self.session.commit()
        return role
