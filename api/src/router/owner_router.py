from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission, validate_access_token
from fastapi import APIRouter, Depends, HTTPException, status
from schema.owner_schema import CreateOwnerRegistration, CreatePoiSubmission
from service.owner_service import OwnerService

router = APIRouter(prefix="/owner", tags=["Owner Controller"])


@router.post("/registrations", status_code=201)
async def create_owner_registration(
    body: CreateOwnerRegistration,
    state: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:register"))
    ],
    owner_service: Annotated[OwnerService, Depends()],
):
    if state.role_name != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ tài khoản người dùng mới có thể đăng ký chủ địa điểm",
        )

    result = await owner_service.create_registration(state.sub, body)
    return ApiResponse(
        success=True,
        message="Gửi hồ sơ đăng ký chủ địa điểm thành công",
        data=result,
    )


@router.get("/registration-status")
async def get_registration_status(
    state: Annotated[AccessTokenPayload, Depends(validate_access_token)],
    owner_service: Annotated[OwnerService, Depends()],
):
    if not {"owner:register", "owner:access"}.intersection(state.permissions):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập",
        )

    poi_owner_registration = await owner_service.get_registration_status(state.sub)

    return ApiResponse(
        success=True,
        message="Lấy dữ liệu thành công",
        data={
            "registration_id": str(poi_owner_registration.id),
            "user_id": str(poi_owner_registration.user_id),
            "business_name": poi_owner_registration.business_name,
            "business_address": poi_owner_registration.business_address,
            "status": poi_owner_registration.status,
            "admin_note": poi_owner_registration.admin_note or None,
            "is_poi_owner_verified": state.is_poi_owner_verified,
        },
    )


@router.get("/poi-submissions")
async def get_poi_submissions(
    state: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:submit_poi"))
    ],
    owner_service: Annotated[OwnerService, Depends()],
):
    result = await owner_service.get_poi_submissions(state.sub)
    return ApiResponse(
        success=True,
        message="Lấy danh sách đơn đăng ký thành công",
        data=result,
    )


@router.get("/pois")
async def get_owner_pois(
    state: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:manage_own_poi"))
    ],
    owner_service: Annotated[OwnerService, Depends()],
):
    result = await owner_service.get_owner_pois(state.sub)
    return ApiResponse(
        success=True,
        message="Lấy danh sách địa điểm thành công",
        data=result,
    )


@router.get("/pois/{poi_id}")
async def get_owner_poi(
    poi_id: str,
    state: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:manage_own_poi"))
    ],
    owner_service: Annotated[OwnerService, Depends()],
):
    result = await owner_service.get_owner_poi(state.sub, poi_id)
    return ApiResponse(
        success=True,
        message="Lấy thông tin địa điểm thành công",
        data=result,
    )


@router.post("/poi-submissions", status_code=201)
async def create_poi_submission(
    body: CreatePoiSubmission,
    state: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:submit_poi"))
    ],
    owner_service: Annotated[OwnerService, Depends()],
):
    result = await owner_service.create_poi_submission(state.sub, body)
    return ApiResponse(
        success=True,
        message="Gửi đơn đăng ký địa điểm thành công",
        data=result,
    )
