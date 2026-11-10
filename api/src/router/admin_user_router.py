from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission, validate_session
from core.pagination import Pagination
from fastapi import APIRouter, Depends, HTTPException, Query, status

from schema.admin_user_schema import (
    CreateAdminUser,
    FilterAdminUser,
    ViewAdminUser,
    UpdateAdminUser,
    AdminUserRoleOption,
)
from service.admin_user_service import AdminUserService


router = APIRouter(
    prefix="/admin-users",
    tags=["Admin User Router"],
)


@router.get("/role-options")
async def role_options(
    principal: Annotated[AccessTokenPayload, Depends(validate_session)],
    service: Annotated[AdminUserService, Depends()],
) -> ApiResponse[list[AdminUserRoleOption]]:
    if not {"user:create", "user:update"}.intersection(principal.permissions):
        raise HTTPException(403, "Bạn không có quyền quản lý người dùng")
    return ApiResponse(success=True, message="Lấy vai trò thành công", data=await service.role_options())


@router.get("/{user_id}", dependencies=[Depends(require_permission("user:update"))])
async def get_admin_user(
    user_id: str,
    service: Annotated[AdminUserService, Depends()],
) -> ApiResponse[ViewAdminUser]:
    return ApiResponse(success=True, message="Lấy người dùng thành công", data=await service.get_admin_user(user_id))


@router.put("/{user_id}", dependencies=[Depends(require_permission("user:update"))])
async def update_admin_user(
    user_id: str,
    body: UpdateAdminUser,
    service: Annotated[AdminUserService, Depends()],
) -> ApiResponse[ViewAdminUser]:
    return ApiResponse(success=True, message="Cập nhật người dùng thành công", data=await service.update_admin_user(user_id, body))


# Lấy danh sách người dùng có phân trang và bộ lọc
@router.get(
    "",
    dependencies=[Depends(require_permission("user:read"))],
)
async def filter_admin_user(
    params: Annotated[FilterAdminUser, Query()],
    admin_user_service: Annotated[AdminUserService, Depends()],
) -> ApiResponse[Pagination[ViewAdminUser]]:

    result = await admin_user_service.filter_admin_user(params)

    return ApiResponse(
        success=True,
        message="Lấy danh sách người dùng thành công",
        data=result,
    )

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("user:create"))],
)
async def create_admin_user(
    body: CreateAdminUser,
    admin_user_service: Annotated[AdminUserService, Depends()],
) -> ApiResponse[ViewAdminUser]:
    result = await admin_user_service.create_admin_user(body)

    return ApiResponse(
        success=True,
        message="Tạo người dùng thành công",
        data=result,
    )
