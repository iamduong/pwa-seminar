import re

from core.pagination import Pagination
from model.admin_user_model import AdminUserModel
from repository.admin_user_repository import AdminUserRepository
from schema.admin_user_schema import FilterAdminUser, ViewAdminUser
from pymongo.asynchronous.database import AsyncDatabase
from core.security import hash_password
from fastapi import HTTPException, status
from repository.role_repository import RoleRepository
from schema.admin_user_schema import CreateAdminUser

class AdminUserService:
    def __init__(self, db: AsyncDatabase):
        self.admin_user_repository = AdminUserRepository(db)
        self.role_repository = RoleRepository(db)

    def _to_view(self, model: AdminUserModel) -> ViewAdminUser:
        return ViewAdminUser(
            id=str(model.id),
            full_name=model.full_name,
            email=model.email,
            phone=model.phone,
            is_active=model.is_active,
            is_poi_owner_verified=model.is_poi_owner_verified,
        )


    async def create_admin_user(
        self, body: CreateAdminUser
    ) -> ViewAdminUser:
        # Chuẩn hóa dữ liệu
        email = body.email.strip().lower()
        phone = body.phone.strip()
        full_name = body.full_name.strip()

        # Kiểm tra email đã tồn tại
        existing_email = await self.admin_user_repository.find_one(
            {"email": email}
        )

        if existing_email is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email đã tồn tại",
            )

        # Kiểm tra số điện thoại đã tồn tại
        existing_phone = await self.admin_user_repository.find_one(
            {"phone": phone}
        )

        if existing_phone is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Số điện thoại đã tồn tại",
            )

        # Tìm vai trò user mặc định
        role = await self.role_repository.find_one(
            {"name": "user", "is_system": True}
        )

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vai trò người dùng chưa được cấu hình",
            )

        # Tạo tài khoản mới
        user = AdminUserModel(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=hash_password(body.password),
            is_active=True,
            is_poi_owner_verified=False,
            role_id=role.id,
        )

        result = await self.admin_user_repository.insert_item(
            user.to_dump()
        )

        # Trả về dữ liệu an toàn, không chứa mật khẩu
        return ViewAdminUser(
            id=str(result.inserted_id),
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            is_poi_owner_verified=user.is_poi_owner_verified,
        )


    async def filter_admin_user(
        self, filters: FilterAdminUser
    ) -> Pagination[ViewAdminUser]:

        search: dict = {}

        if filters.q is not None and filters.q.strip():
            keyword = re.escape(filters.q.strip())

            search["$or"] = [
                {"full_name": {"$regex": keyword, "$options": "i"}},
                {"email": {"$regex": keyword, "$options": "i"}},
                {"phone": {"$regex": keyword, "$options": "i"}},
            ]

        if filters.is_active is not None:
            search["is_active"] = filters.is_active

        if filters.is_poi_owner_verified is not None:
            search["is_poi_owner_verified"] = (
                filters.is_poi_owner_verified
            )

        total_item = await self.admin_user_repository.count_search(search)

        users = await self.admin_user_repository.find_pagination(
            page=filters.page,
            page_size=filters.page_size,
            search=search,
            sort_by="full_name",
            sort_order="asc",
        )

        total_page = (
            total_item + filters.page_size - 1
        ) // filters.page_size

        return Pagination[ViewAdminUser](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[self._to_view(user) for user in users],
        )