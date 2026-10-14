from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import require_permission
from fastapi import APIRouter, Depends
from schema.admin_schema import AdminUserFilter, UpdatePoiPOwnerRegistration
from service.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin Controller"])


# interaction document - collection: poi_owner_registration
@router.patch("/registrations/{registration_id}")
async def review_registration(
    registration_id: str,
    body: UpdatePoiPOwnerRegistration,
    admin_service: Annotated[AdminService, Depends()],
) -> ApiResponse[dict]:
    result = await admin_service.review_registration(registration_id, body)

    return ApiResponse(
        success=True,
        message="Cập nhật đơn đăng ký thành công",
        data=result,
    )


# interact document - collection: admin_user
@router.get(
    "/admin-users",
    dependencies=[Depends(require_permission("admin:user:read"))],
)
async def filter_admin_users(
    filters: Annotated[AdminUserFilter, Depends()],
    admin_service: Annotated[AdminService, Depends()],
):
    result = await admin_service.filter_admin_users(filters)
    return ApiResponse(
        success=True, message="Lấy dữ liệu người dùng thành công", data=result
    )


@router.get("/amdin-user/{id}")
async def get_admin_user_by_id(id: str):

    pass
