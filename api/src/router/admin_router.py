from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from fastapi import APIRouter, Depends
from schema.admin_schema import (
    AdminUserFilter,
    PoiSubmissionFilter,
    ReviewPoiSubmission,
    UpdatePoiPOwnerRegistration,
)
from service.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin Controller"])


# interaction document - collection: poi_owner_registration
@router.patch(
    "/registrations/{registration_id}",
    dependencies=[Depends(require_permission("poi:approve"))],
)
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


@router.get("/poi-submissions")
async def filter_poi_submissions(
    filters: Annotated[PoiSubmissionFilter, Depends()],
    _state: Annotated[
        AccessTokenPayload, Depends(require_permission("poi:approve"))
    ],
    admin_service: Annotated[AdminService, Depends()],
):
    result = await admin_service.filter_poi_submissions(filters)
    return ApiResponse(
        success=True,
        message="Lấy danh sách đơn đăng ký địa điểm thành công",
        data=result,
    )


@router.get("/poi-submissions/{submission_id}")
async def get_poi_submission(
    submission_id: str,
    _state: Annotated[
        AccessTokenPayload, Depends(require_permission("poi:approve"))
    ],
    admin_service: Annotated[AdminService, Depends()],
):
    result = await admin_service.get_poi_submission(submission_id)
    return ApiResponse(
        success=True,
        message="Lấy đơn đăng ký địa điểm thành công",
        data=result,
    )


@router.patch("/poi-submissions/{submission_id}")
async def review_poi_submission(
    submission_id: str,
    body: ReviewPoiSubmission,
    state: Annotated[
        AccessTokenPayload, Depends(require_permission("poi:approve"))
    ],
    admin_service: Annotated[AdminService, Depends()],
):
    result = await admin_service.review_poi_submission(
        submission_id, state.sub, body
    )
    return ApiResponse(
        success=True,
        message="Đã xử lý đơn đăng ký địa điểm",
        data=result,
    )
