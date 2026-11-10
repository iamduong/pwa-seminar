from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission, validate_session
from core.pagination import Pagination
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from schema.poi_schema import (
    CreateAdminPoi,
    FilterOwnerPoi,
    ViewOwnerPoi,
    ViewOwnerPoiDetail,
)
from service.poi_service import PoiService
from schema.menu_item_schema import (
    MenuItemCreate,
    MenuItemFilter,
    MenuItemView,
)
from service.menu_item_service import MenuItemService
from util.image import save_poi_images


router = APIRouter(prefix="/pois", tags=["POI Controller"])


@router.post("/images")
async def upload_poi_images(
    images: Annotated[list[UploadFile], File()],
    principal: Annotated[AccessTokenPayload, Depends(validate_session)],
) -> ApiResponse[list[str]]:
    if not ({"poi:create", "owner:poi_submit"} & set(principal.permissions)):
        raise HTTPException(403, "Bạn không có quyền tải ảnh POI")
    return ApiResponse(
        success=True,
        message="Tải ảnh POI thành công",
        data=await save_poi_images(images),
    )


@router.get("/mine")
async def filter_my_pois(
    params: Annotated[FilterOwnerPoi, Query()],
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:poi_read"))],
    poi_service: Annotated[PoiService, Depends()],
) -> ApiResponse[Pagination[ViewOwnerPoi]]:
    result = await poi_service.filter_owner_pois(params, principal.sub)

    return ApiResponse(success=True, message="Lấy POI của bạn thành công", data=result)


@router.get("/mine/{poi_id}")
async def get_my_poi_detail(
    poi_id: str,
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:poi_read"))],
    poi_service: Annotated[PoiService, Depends()],
) -> ApiResponse[ViewOwnerPoiDetail]:
    result = await poi_service.get_owner_poi_detail(poi_id, principal.sub)
    return ApiResponse(
        success=True,
        message="Lấy chi tiết POI thành công",
        data=result,
    )


@router.get("/{poi_id}/detail")
async def get_admin_poi_detail(
    poi_id: str,
    principal: Annotated[AccessTokenPayload, Depends(require_permission("poi:read"))],
    poi_service: Annotated[PoiService, Depends()],
) -> ApiResponse[ViewOwnerPoiDetail]:
    result = await poi_service.get_admin_poi_detail(poi_id)
    return ApiResponse(
        success=True,
        message="Lấy chi tiết POI thành công",
        data=result,
    )


@router.get("/{poi_id}/menu-items")
async def list_poi_menu_items(
    poi_id: str,
    params: Annotated[MenuItemFilter, Query()],
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:read")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[Pagination[MenuItemView]]:
    result = await service.list_by_poi(poi_id, params)

    return ApiResponse(
        success=True,
        message="Lấy danh sách món ăn thành công",
        data=result,
    )


@router.post("/{poi_id}/menu-items", status_code=201)
async def create_poi_menu_item(
    poi_id: str,
    body: MenuItemCreate,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:create")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[MenuItemView]:
    result = await service.create_direct(poi_id, body)

    return ApiResponse(
        success=True,
        message="Thêm món ăn thành công",
        data=result,
    )


@router.get("")
async def list_admin_pois(
    params: Annotated[FilterOwnerPoi, Query()],
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("poi:read")),
    ],
    service: Annotated[PoiService, Depends()],
) -> ApiResponse[Pagination[ViewOwnerPoi]]:
    return ApiResponse(
        success=True,
        message="Lấy danh sách POI thành công",
        data=await service.filter_admin_pois(params),
    )


@router.post("", status_code=201)
async def create_admin_poi(
    body: CreateAdminPoi,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("poi:create")),
    ],
    service: Annotated[PoiService, Depends()],
) -> ApiResponse[ViewOwnerPoi]:
    return ApiResponse(
        success=True,
        message="Tạo POI trực tiếp thành công",
        data=await service.create_admin_poi(body),
    )


@router.get("/{poi_id}/summary")
async def get_poi_summary(
    poi_id: str,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("menu:read")),
    ],
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[dict[str, str]]:
    return ApiResponse(
        success=True,
        message="Lấy thông tin POI thành công",
        data=await service.get_poi_summary(poi_id),
    )
