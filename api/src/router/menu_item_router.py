from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from fastapi import APIRouter, Depends, status, Query
from model.menu_item_submission_model import MenuItemSubmissionStatus
from schema.menu_item_schema import (
    MenuItemSubmissionCreate,
    MenuItemSubmissionFilter,
    MenuItemSubmissionView,
    MenuItemReject,
    MenuItemReviewFilter,
    MenuItemView,
)
from service.menu_item_service import MenuItemService
from core.pagination import Pagination

router = APIRouter(prefix="/menu-items", tags=["Menu Items"])


@router.get("/my-pois")
async def list_my_pois(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_read"))
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[list[dict[str, str]]]:
    return ApiResponse(
        success=True,
        message="Lấy danh sách địa điểm của chủ quán thành công",
        data=await service.list_owned_pois(principal.sub),
    )


@router.get("/mine")
async def list_my_submissions(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_read"))
    ],
    service: Annotated[MenuItemService, Depends()],
    filters: Annotated[MenuItemSubmissionFilter, Depends()],
) -> ApiResponse[list[MenuItemSubmissionView]]:
    return ApiResponse(
        success=True,
        message="Lấy danh sách yêu cầu thực đơn thành công",
        data=await service.list_self(principal.sub, filters.status),
    )


@router.post(
    "/requests",
    status_code=status.HTTP_201_CREATED,
)
async def create_menu_request(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_submit"))
    ],
    body: MenuItemSubmissionCreate,
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemSubmissionView]:
    return ApiResponse(
        success=True,
        message="Gửi yêu cầu thêm món ăn thành công",
        data=await service.create_submission(principal.sub, body),
    )


@router.get("/requests")
async def list_menu_requests(
    poi_id: str,
    params: Annotated[MenuItemReviewFilter, Query()],
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:read")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[Pagination[MenuItemSubmissionView]]:
    return ApiResponse(
        success=True,
        message="Lấy yêu cầu món ăn thành công",
        data=await service.list_requests(poi_id, params),
    )


@router.post("/requests/{request_id}/approve")
async def approve_menu_request(
    request_id: str,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:review")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemSubmissionView]:
    return ApiResponse(
        success=True,
        message="Duyệt món ăn thành công",
        data=await service.approve_request(request_id, principal.sub),
    )


@router.post("/requests/{request_id}/reject")
async def reject_menu_request(
    request_id: str,
    body: MenuItemReject,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:review")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemSubmissionView]:
    return ApiResponse(
        success=True,
        message="Đã từ chối yêu cầu",
        data=await service.reject_request(
            request_id,
            principal.sub,
            body.admin_note,
        ),
    )

@router.post("/by-poi/{poi_id}/{item_id}/approve")
async def approve_menu_item(
    poi_id: str,
    item_id: str,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:review")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(
        success=True,
        message="Duyệt món ăn thành công",
        data=await service.approve_item(poi_id, item_id),
    )