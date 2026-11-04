import re
from datetime import UTC, datetime

from bson import ObjectId
from core.dependency import MongoDB
from core.pagination import Pagination
from core.permission import PERMISSIONS
from fastapi import HTTPException, status
from model.role_model import RoleModel
from repository.admin_user_repository import AdminUserRepository
from repository.role_repository import RoleRepository
from schema.role_schema import CreateRole, FilterRole, UpdateRole, ViewRole


class RoleService:
    def __init__(self, db: MongoDB):
        self.role_repository = RoleRepository(db)
        self.admin_user_repository = AdminUserRepository(db)

    def _to_view(self, role: RoleModel) -> ViewRole:
        return ViewRole(
            id=str(role.id),
            name=role.name,
            permissions=role.permissions,
            is_system=role.is_system,
            priority=role.priority,
            created_at=role.created_at,
            updated_at=role.updated_at,
            deleted_at=role.deleted_at,
        )

    def _validate_permissions(self, permissions: list[str]) -> list[str]:
        normalized = list(dict.fromkeys(permissions))
        invalid_permissions = [
            permission
            for permission in normalized
            if permission not in PERMISSIONS
        ]

        if invalid_permissions:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Quyền không hợp lệ: {', '.join(invalid_permissions)}",
            )

        return normalized

    async def _get_role_or_404(self, role_id: str) -> RoleModel:
        role = await self.role_repository.find_one(
            {
                "_id": ObjectId(role_id),
                "deleted_at": None,
            }
        )

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy vai trò",
            )

        return role

    async def _get_deleted_role_or_404(self, role_id: str) -> RoleModel:
        role = await self.role_repository.find_one(
            {
                "_id": ObjectId(role_id),
                "deleted_at": {"$ne": None},
            }
        )

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy vai trò đã xóa",
            )

        return role

    async def filter_roles(
        self,
        filters: FilterRole,
    ) -> Pagination[ViewRole]:
        search: dict = {
            "deleted_at": {"$ne": None} if filters.is_deleted else None,
        }

        if filters.q:
            keyword = filters.q.strip()
            if keyword:
                search["name"] = {
                    "$regex": re.escape(keyword),
                    "$options": "i",
                }

        total_item = await self.role_repository.count_filter(search)
        roles = await self.role_repository.find_pagination(
            page=filters.page,
            page_size=filters.page_size,
            search=search,
        )

        total_page = (total_item + filters.page_size - 1) // filters.page_size

        return Pagination[ViewRole](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[self._to_view(role) for role in roles],
        )

    async def get_role(self, role_id: str) -> ViewRole:
        role = await self._get_role_or_404(role_id)
        return self._to_view(role)

    async def create_role(self, body: CreateRole) -> ViewRole:
        name = body.name.strip()
        existing = await self.role_repository.find_one(
            {
                "name": name,
                "deleted_at": None,
            }
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tên vai trò đã tồn tại",
            )

        role = RoleModel(
            name=name,
            permissions=self._validate_permissions(body.permissions),
            is_system=False,
            priority=body.priority,
        )

        await self.role_repository.insert_item(role.to_dump())
        return self._to_view(role)

    async def update_role(self, role_id: str, body: UpdateRole) -> ViewRole:
        role = await self._get_role_or_404(role_id)

        document = body.model_dump(exclude_unset=True, exclude_none=True)

        if role.is_system:
            forbidden_fields = set(document) - {"name"}

            if forbidden_fields:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vai trò hệ thống chỉ được cập nhật tên",
                )

        if "name" in document:
            name = document["name"].strip()
            duplicate = await self.role_repository.find_one(
                {
                    "_id": {"$ne": role.id},
                    "name": name,
                    "deleted_at": None,
                }
            )

            if duplicate is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Tên vai trò đã tồn tại",
                )

            document["name"] = name

        if "permissions" in document:
            document["permissions"] = self._validate_permissions(
                document["permissions"]
            )

        document["updated_at"] = datetime.now(UTC)
        result = await self.role_repository.update_by_id(role.id, document)

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy vai trò",
            )

        updated_role = await self._get_role_or_404(role_id)
        return self._to_view(updated_role)

    async def restore_role(self, role_id: str) -> ViewRole:
        role = await self._get_deleted_role_or_404(role_id)

        duplicate = await self.role_repository.find_one(
            {
                "_id": {"$ne": role.id},
                "name": role.name,
                "deleted_at": None,
            }
        )

        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Không thể khôi phục vì tên vai trò đã được sử dụng",
            )

        result = await self.role_repository.restore_by_id(
            role.id,
            datetime.now(UTC),
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy vai trò đã xóa",
            )

        restored_role = await self._get_role_or_404(role_id)
        return self._to_view(restored_role)

    async def delete_role(self, role_id: str) -> None:
        role = await self._get_role_or_404(role_id)

        if role.is_system:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không thể xóa vai trò hệ thống",
            )

        assigned_user_count = await self.admin_user_repository.count_filter(
            {
                "role_id": role.id,
                "deleted_at": None,
            }
        )

        if assigned_user_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Không thể xóa vai trò đang được gán cho tài khoản",
            )

        result = await self.role_repository.delete_by_id(
            role.id,
            datetime.now(UTC),
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy vai trò",
            )
