from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from fastapi import APIRouter, Depends, status
from schema.menu_item_schema import MenuItemSave, MenuItemView
from service.menu_item_service import MenuItemService

router = APIRouter(prefix="/menu-items", tags=["Menu Items"])


@router.get("/my-pois")
async def list_my_pois(
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:menu_read"))],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[list[dict[str, str]]]:
    return ApiResponse(success=True, message="Lấy địa điểm thành công", data=await service.list_owned_pois(principal.sub))


@router.get("/mine")
async def list_my_items(
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:menu_read"))],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[list[MenuItemView]]:
    return ApiResponse(success=True, message="Lấy thực đơn thành công", data=await service.list_self(principal.sub))


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/requests", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_menu_item(
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:menu_submit"))],
    body: MenuItemSave,
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(success=True, message="Đã thêm món ăn, chờ duyệt", data=await service.create(principal.sub, body))


@router.get("/{item_id}")
async def get_menu_item(
    item_id: str,
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:menu_read"))],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(success=True, message="Lấy món ăn thành công", data=await service.get_owned(principal.sub, item_id))


@router.put("/{item_id}")
async def update_menu_item(
    item_id: str,
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:menu_submit"))],
    body: MenuItemSave,
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(success=True, message="Đã lưu món ăn, chờ duyệt lại", data=await service.update(principal.sub, item_id, body))
