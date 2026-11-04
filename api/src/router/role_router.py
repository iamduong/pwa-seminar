from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import require_permission
from core.pagination import Pagination
from core.permission import PERMISSIONS
from fastapi import APIRouter, Depends, Query, status
from schema.role_schema import CreateRole, FilterRole, UpdateRole, ViewRole
from service.role_service import RoleService

router = APIRouter(prefix="/roles", tags=["Role Controller"])


@router.get(
    "/permissions",
    dependencies=[Depends(require_permission("role:read"))],
)
async def get_permissions() -> ApiResponse[list[str]]:
    return ApiResponse(
        success=True,
        message="Lấy danh sách quyền thành công",
        data=PERMISSIONS,
    )


@router.get(
    "",
    dependencies=[Depends(require_permission("role:read"))],
)
async def filter_roles(
    params: Annotated[FilterRole, Query()],
    role_service: Annotated[RoleService, Depends()],
) -> ApiResponse[Pagination[ViewRole]]:
    result = await role_service.filter_roles(params)

    return ApiResponse(
        success=True,
        message="Lấy danh sách vai trò thành công",
        data=result,
    )


@router.get(
    "/{role_id}",
    dependencies=[Depends(require_permission("role:read"))],
)
async def get_role(
    role_id: str,
    role_service: Annotated[RoleService, Depends()],
) -> ApiResponse[ViewRole]:
    result = await role_service.get_role(role_id)

    return ApiResponse(
        success=True,
        message="Lấy thông tin vai trò thành công",
        data=result,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("role:create"))],
)
async def create_role(
    body: CreateRole,
    role_service: Annotated[RoleService, Depends()],
) -> ApiResponse[ViewRole]:
    result = await role_service.create_role(body)

    return ApiResponse(
        success=True,
        message="Tạo vai trò thành công",
        data=result,
    )


@router.patch(
    "/{role_id}",
    dependencies=[Depends(require_permission("role:update"))],
)
async def update_role(
    role_id: str,
    body: UpdateRole,
    role_service: Annotated[RoleService, Depends()],
) -> ApiResponse[ViewRole]:
    result = await role_service.update_role(role_id, body)

    return ApiResponse(
        success=True,
        message="Cập nhật vai trò thành công",
        data=result,
    )


@router.delete(
    "/{role_id}",
    dependencies=[Depends(require_permission("role:delete"))],
)
async def delete_role(
    role_id: str,
    role_service: Annotated[RoleService, Depends()],
) -> ApiResponse[None]:
    await role_service.delete_role(role_id)

    return ApiResponse(
        success=True,
        message="Xóa vai trò thành công",
    )


@router.patch(
    "/{role_id}/restore",
    dependencies=[Depends(require_permission("role:delete"))],
)
async def restore_role(
    role_id: str,
    role_service: Annotated[RoleService, Depends()],
) -> ApiResponse[ViewRole]:
    result = await role_service.restore_role(role_id)

    return ApiResponse(
        success=True,
        message="Khôi phục vai trò thành công",
        data=result,
    )
