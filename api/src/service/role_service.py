from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from core.permission import PERMISSIONS
from fastapi import HTTPException, status
from model.role_model import RoleModel
from repository.role_repository import RoleRepository
from schema.role_schema import CreateRole, FilterRole, UpdateRole, ViewRole


class RoleService:
    def __init__(self, db: PostgresDB):
        self.repository = RoleRepository(db)

    @staticmethod
    def _view(role: RoleModel) -> ViewRole:
        return ViewRole(id=str(role.id), name=role.name, permissions=role.permissions, is_system=role.is_system, priority=role.priority, created_at=role.created_at, updated_at=role.updated_at, deleted_at=role.deleted_at)

    @staticmethod
    def _permissions(values: list[str]) -> list[str]:
        values = list(dict.fromkeys(values))
        invalid = [value for value in values if value not in PERMISSIONS]
        if invalid:
            raise HTTPException(422, f"Quyền không hợp lệ: {', '.join(invalid)}")
        return values

    async def _get(self, value: str, deleted: bool = False):
        role = await self.repository.find_by_id(parse_uuid(value, "Mã vai trò"), deleted=deleted)
        if role is None:
            raise HTTPException(404, "Không tìm thấy vai trò đã xóa" if deleted else "Không tìm thấy vai trò")
        return role

    async def filter_roles(self, filters: FilterRole):
        roles, total = await self.repository.find_pagination(filters.page, filters.page_size, keyword=filters.q, deleted=filters.is_deleted)
        return Pagination[ViewRole](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._view(x) for x in roles])

    async def get_role(self, role_id: str):
        return self._view(await self._get(role_id))

    async def create_role(self, body: CreateRole):
        name = body.name.strip()
        if await self.repository.find_by_name(name):
            raise HTTPException(status.HTTP_409_CONFLICT, "Tên vai trò đã tồn tại")
        role = await self.repository.insert(RoleModel(name=name, permissions=self._permissions(body.permissions), is_system=False, priority=body.priority))
        return self._view(role)

    async def update_role(self, role_id: str, body: UpdateRole):
        role = await self._get(role_id)
        changes = body.model_dump(exclude_unset=True, exclude_none=True)
        if role.is_system and set(changes) - {"name"}:
            raise HTTPException(403, "Vai trò hệ thống chỉ được cập nhật tên")
        if "name" in changes:
            if await self.repository.find_by_name(changes["name"], exclude_id=role.id):
                raise HTTPException(409, "Tên vai trò đã tồn tại")
            role.name = changes["name"]
        if "permissions" in changes:
            role.permissions = self._permissions(changes["permissions"])
        if "priority" in changes:
            role.priority = changes["priority"]
        return self._view(await self.repository.save(role))

    async def delete_role(self, role_id: str):
        role = await self._get(role_id)
        if role.is_system:
            raise HTTPException(403, "Không thể xóa vai trò hệ thống")
        if await self.repository.count_assigned_users(role.id):
            raise HTTPException(409, "Không thể xóa vai trò đang được gán cho tài khoản")
        await self.repository.soft_delete(role)

    async def restore_role(self, role_id: str):
        role = await self._get(role_id, deleted=True)
        if await self.repository.find_by_name(role.name, exclude_id=role.id):
            raise HTTPException(409, "Không thể khôi phục vì tên vai trò đã được sử dụng")
        return self._view(await self.repository.restore(role))
