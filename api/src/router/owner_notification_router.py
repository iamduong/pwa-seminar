from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query
from schema.owner_notification_schema import FilterOwnerNotification, ViewOwnerNotification
from service.owner_notification_service import OwnerNotificationService


router = APIRouter(prefix="/owner-notifications", tags=["Owner Notifications"])


@router.get("")
async def filter_notifications(
    filters: Annotated[FilterOwnerNotification, Query()],
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("owner_notification:read")),
    ],
    service: Annotated[OwnerNotificationService, Depends()],
) -> ApiResponse[Pagination[ViewOwnerNotification]]:
    return ApiResponse(
        success=True,
        message="Lấy danh sách thông báo thành công",
        data=await service.filter_self(principal.sub, filters),
    )


@router.get("/unread-count")
async def unread_count(
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("owner_notification:read")),
    ],
    service: Annotated[OwnerNotificationService, Depends()],
) -> ApiResponse[dict[str, int]]:
    return ApiResponse(
        success=True,
        message="Lấy số thông báo chưa đọc thành công",
        data={"unread_count": await service.count_unread(principal.sub)},
    )


@router.patch("/read-all")
async def mark_all_read(
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("owner_notification:update")),
    ],
    service: Annotated[OwnerNotificationService, Depends()],
) -> ApiResponse[None]:
    await service.mark_all_read(principal.sub)
    return ApiResponse(success=True, message="Đã đánh dấu tất cả thông báo là đã đọc")


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: str,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("owner_notification:update")),
    ],
    service: Annotated[OwnerNotificationService, Depends()],
) -> ApiResponse[ViewOwnerNotification]:
    return ApiResponse(
        success=True,
        message="Đã đánh dấu thông báo là đã đọc",
        data=await service.mark_read(principal.sub, notification_id),
    )
