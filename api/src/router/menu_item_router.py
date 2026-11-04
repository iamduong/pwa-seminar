from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from fastapi import APIRouter, Depends, status
from model.menu_item_submission_model import MenuItemSubmissionStatus
from schema.menu_item_schema import (
    MenuItemSubmissionCreate,
    MenuItemSubmissionFilter,
    MenuItemSubmissionView,
)
from service.menu_item_service import MenuItemService

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
