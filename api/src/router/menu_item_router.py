from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission, validate_session
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from schema.menu_item_schema import MenuItemFilter, MenuItemSave, MenuItemView
from service.cloudinary_service import CloudinaryService
from service.menu_item_service import MenuItemService

router = APIRouter(prefix="/menu-items", tags=["Menu Items"])


@router.post("/images")
async def upload_menu_item_image(
    image: Annotated[UploadFile, File()],
    principal: Annotated[AccessTokenPayload, Depends(validate_session)],
    service: Annotated[CloudinaryService, Depends()],
) -> ApiResponse[dict[str, str]]:
    allowed_permissions = {"menu:create", "menu:update", "owner:menu_submit"}
    if not (allowed_permissions & set(principal.permissions)):
        raise HTTPException(403, "Bạn không có quyền tải ảnh món ăn")

    return ApiResponse(
        success=True,
        message="Tải ảnh món ăn thành công",
        data=await service.upload_image(image),
    )


@router.get("/admin/pois")
async def list_admin_pois_for_menu(
    params: Annotated[MenuItemFilter, Depends()],
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:read")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse:
    return ApiResponse(
        success=True,
        message="Lấy danh sách địa điểm để quản lý thực đơn thành công",
        data=await service.list_admin_pois(params),
    )


@router.get("/my-pois")
async def list_my_pois(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_read"))
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[list[dict[str, str]]]:
    return ApiResponse(
        success=True,
        message="Lấy địa điểm thành công",
        data=await service.list_owned_pois(principal.sub),
    )


@router.get("/mine")
async def list_my_items(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_read"))
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[list[MenuItemView]]:
    return ApiResponse(
        success=True,
        message="Lấy thực đơn thành công",
        data=await service.list_self(principal.sub),
    )


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/requests", status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_menu_item(
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_submit"))
    ],
    body: MenuItemSave,
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(
        success=True,
        message="Đã thêm món ăn, chờ duyệt",
        data=await service.create(principal.sub, body),
    )


@router.post("/by-poi/{poi_id}/{item_id}/approve")
async def approve_menu_item(
    poi_id: str,
    item_id: str,
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("menu:review"))
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(
        success=True,
        message="Duyệt món ăn thành công",
        data=await service.approve_item(poi_id, item_id),
    )


@router.get("/{item_id}")
async def get_menu_item(
    item_id: str,
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_read"))
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(
        success=True,
        message="Lấy món ăn thành công",
        data=await service.get_owned(principal.sub, item_id),
    )


@router.put("/{item_id}")
async def update_menu_item(
    item_id: str,
    principal: Annotated[
        AccessTokenPayload, Depends(require_permission("owner:menu_submit"))
    ],
    body: MenuItemSave,
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    return ApiResponse(
        success=True,
        message="Đã lưu món ăn, chờ duyệt lại",
        data=await service.update(principal.sub, item_id, body),
    )
