from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query
from schema.poi_submission_shema import (
    FilterPoiSubmission,
    RegisterPoiSubmission,
    ReviewPoiSubmission,
    ViewPoiSubmission,
)
from service.poi_submission_service import PoiSubmissionService

router = APIRouter(prefix="/poi-registrations", tags=["Poi Registration Controller"])


# Get all poi registration
@router.get("", dependencies=[])
async def filter_poi_registration(
    params: Annotated[FilterPoiSubmission, Query()],
    poi_submission_service: Annotated[PoiSubmissionService, Depends()],
) -> ApiResponse[Pagination[ViewPoiSubmission]]:
    result = await poi_submission_service.filter_poi_submission(params)

    return ApiResponse(
        success=True, message="Lấy danh sách đăng ký POI thành công", data=result
    )


@router.get("/mine")
async def filter_my_poi_registration(
    params: Annotated[FilterPoiSubmission, Query()],
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:poi_read"))
    ],
    poi_submission_service: Annotated[PoiSubmissionService, Depends()],
) -> ApiResponse[Pagination[ViewPoiSubmission]]:
    result = await poi_submission_service.filter_owner_poi_submission(
        params, principal.sub
    )

    return ApiResponse(
        success=True, message="Lấy đơn đăng ký POI của bạn thành công", data=result
    )


# Get poi registration by id
@router.get("/{poi_submission_id}", dependencies=[])
async def get_poi_registration_by_id(
    poi_submission_id: str,
    poi_submission_service: Annotated[PoiSubmissionService, Depends()],
) -> ApiResponse[ViewPoiSubmission]:
    result = await poi_submission_service.get_poi_submission_by_id(
        poi_submission_id
    )

    return ApiResponse(
        success=True, message="Lấy đăng ký POI thành công", data=result
    )


# Review poi registration
@router.post("/review/{poi_submission_id}", dependencies=[])
async def review_poi_registration(
    poi_submission_id: str,
    body: ReviewPoiSubmission,
    poi_submission_service: Annotated[PoiSubmissionService, Depends()],
) -> ApiResponse[ViewPoiSubmission]:
    result = await poi_submission_service.review_poi_submission(
        poi_submission_id, body
    )

    return ApiResponse(
        success=True, message="Duyệt đăng ký POI thành công", data=result
    )


# Register poi registration
@router.post("/register", dependencies=[])
async def register_poi_registration(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:poi_submit"))
    ],
    body: RegisterPoiSubmission,
    poi_submission_service: Annotated[PoiSubmissionService, Depends()],
) -> ApiResponse[ViewPoiSubmission]:
    result = await poi_submission_service.register_poi_submission(body, principal.sub)

    return ApiResponse(success=True, message="Gửi đăng ký POI thành công", data=result)
