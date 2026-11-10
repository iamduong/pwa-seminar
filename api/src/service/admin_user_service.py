from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from core.security import hash_password
from fastapi import HTTPException
from model.admin_user_model import AdminUserModel
from repository.admin_user_repository import AdminUserRepository
from repository.role_repository import RoleRepository
from schema.admin_user_schema import AdminUserRoleOption, CreateAdminUser, FilterAdminUser, UpdateAdminUser, ViewAdminUser
from model.role_model import RoleModel
from sqlalchemy import select


class AdminUserService:
    def __init__(self, db: PostgresDB):
        self.users = AdminUserRepository(db)
        self.roles = RoleRepository(db)
        self.db = db

    @staticmethod
    def _view(user, role=None):
        return ViewAdminUser(id=str(user.id), full_name=user.full_name, email=user.email, phone=user.phone, is_active=user.is_active, is_poi_owner_verified=user.is_poi_owner_verified, role_id=str(user.role_id) if user.role_id else None, role_name=role.name if role else None)

    async def role_options(self):
        roles = await self.db.scalars(select(RoleModel).where(RoleModel.deleted_at.is_(None)).order_by(RoleModel.priority, RoleModel.name))
        return [AdminUserRoleOption(id=str(role.id), name=role.name) for role in roles]

    async def get_admin_user(self, user_id: str):
        user = await self.users.find_by_id(parse_uuid(user_id, "Mã tài khoản"))
        if user is None:
            raise HTTPException(404, "Không tìm thấy người dùng")
        role = await self.roles.find_by_id(user.role_id) if user.role_id else None
        return self._view(user, role)

    async def update_admin_user(self, user_id: str, body: UpdateAdminUser):
        user = await self.users.find_by_id(parse_uuid(user_id, "Mã tài khoản"))
        if user is None:
            raise HTTPException(404, "Không tìm thấy người dùng")
        role = await self.roles.find_by_id(body.role_id)
        if role is None:
            raise HTTPException(400, "Vai trò không tồn tại hoặc đã bị xóa")
        user.full_name = body.full_name
        user.is_active = body.is_active
        user.role_id = role.id
        user = await self.users.update(user)
        return self._view(user, role)

    async def create_admin_user(self, body: CreateAdminUser):
        email, phone = body.email.strip().lower(), body.phone.strip()
        if await self.users.find_by_email_or_phone(email, phone):
            raise HTTPException(400, "Email hoặc SĐT đã tồn tại")
        role = await self.roles.find_by_id(body.role_id)
        if role is None:
            raise HTTPException(400, "Vai trò không tồn tại hoặc đã bị xóa")
        user = await self.users.insert(AdminUserModel(full_name=body.full_name.strip(), email=email, phone=phone, password_hash=hash_password(body.password), is_active=body.is_active, is_poi_owner_verified=False, role_id=role.id))
        return self._view(user, role)

    async def filter_admin_user(self, filters: FilterAdminUser):
        users, total = await self.users.find_pagination(filters.page, filters.page_size, keyword=filters.q, is_active=filters.is_active, is_poi_owner_verified=filters.is_poi_owner_verified)
        role_ids = {user.role_id for user in users if user.role_id}
        roles = await self.db.scalars(select(RoleModel).where(RoleModel.id.in_(role_ids), RoleModel.deleted_at.is_(None)))
        role_map = {role.id: role for role in roles}
        return Pagination[ViewAdminUser](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._view(user, role_map.get(user.role_id)) for user in users])
