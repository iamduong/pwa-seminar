from core.dependency import PostgresDB
from core.pagination import Pagination
from core.security import hash_password
from fastapi import HTTPException
from model.admin_user_model import AdminUserModel
from repository.admin_user_repository import AdminUserRepository
from repository.role_repository import RoleRepository
from schema.admin_user_schema import CreateAdminUser, FilterAdminUser, ViewAdminUser


class AdminUserService:
    def __init__(self, db: PostgresDB):
        self.users = AdminUserRepository(db)
        self.roles = RoleRepository(db)

    @staticmethod
    def _view(user):
        return ViewAdminUser(id=str(user.id), full_name=user.full_name, email=user.email, phone=user.phone, is_active=user.is_active, is_poi_owner_verified=user.is_poi_owner_verified)

    async def create_admin_user(self, body: CreateAdminUser):
        email, phone = body.email.strip().lower(), body.phone.strip()
        if await self.users.find_by_email_or_phone(email, phone):
            raise HTTPException(400, "Email hoặc SĐT đã tồn tại")
        role = await self.roles.find_by_name("user", system_only=True)
        if role is None:
            raise HTTPException(503, "Vai trò người dùng chưa được cấu hình")
        user = await self.users.insert(AdminUserModel(full_name=body.full_name.strip(), email=email, phone=phone, password_hash=hash_password(body.password), is_active=True, is_poi_owner_verified=False, role_id=role.id))
        return self._view(user)

    async def filter_admin_user(self, filters: FilterAdminUser):
        users, total = await self.users.find_pagination(filters.page, filters.page_size, keyword=filters.q, is_active=filters.is_active, is_poi_owner_verified=filters.is_poi_owner_verified)
        return Pagination[ViewAdminUser](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._view(x) for x in users])
