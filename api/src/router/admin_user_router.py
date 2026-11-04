from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import MongoDB, require_permission
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query

from schema.admin_user_schema import FilterAdminUser, ViewAdminUser
from service.admin_user_service import AdminUserService


router = APIRouter(
    prefix="/admin-users",
    tags=["Admin User Router"],
)


# Dependency khởi tạo AdminUserService
def get_admin_user_service(db: MongoDB) -> AdminUserService:
    return AdminUserService(db)


# Lấy danh sách người dùng có phân trang và bộ lọc
@router.get(
    "",
    dependencies=[Depends(require_permission("user:read"))],
)
async def filter_admin_user(
    params: Annotated[FilterAdminUser, Query()],
    admin_user_service: Annotated[
        AdminUserService, Depends(get_admin_user_service)
    ],
) -> ApiResponse[Pagination[ViewAdminUser]]:

    result = await admin_user_service.filter_admin_user(params)

    return ApiResponse(
        success=True,
        message="Lấy danh sách người dùng thành công",
        data=result,
    )
