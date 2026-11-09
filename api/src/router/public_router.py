from datetime import datetime
from typing import Annotated

from core.api_response import ApiResponse
from core.pagination import Pagination
from core.ui_bundle import UiBundle
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Response, status
from schema.menu_item_schema import MenuItemView
from schema.poi_category_schema import FilterPoiCategory, ViewPoiCategory
from schema.poi_dataset_schema import PoiDataset
from service.content_dataset_version_service import ContentDatasetVersionService
from service.menu_item_service import MenuItemService
from service.poi_category_service import PoiCategoryService
from service.poi_service import PoiService
from service.ui_bundle_service import UiBundleService

router = APIRouter(prefix="/public", tags=["Public Controller"])
POI_CACHE_SCHEMA_VERSION = 2


@router.get("/ui/load-all", response_model=None)
async def bundle_ui(
    lang: str,
    ui_bundle_service: Annotated[UiBundleService, Depends()],
    etag: str | None = Header(default=None, alias="Etag"),
):
    bundle = await ui_bundle_service.find_by_lang(lang)
    if bundle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ngôn ngữ giao diện không được hỗ trợ: {lang}",
        )

    if bundle.etag == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    return ApiResponse[UiBundle](
        success=True,
        message="Đồng bộ giao diện thành công",
        data=bundle,
    )


@router.get("/pois/{poi_id}/menu-items")
async def list_public_menu(
    poi_id: str,
    service: Annotated[MenuItemService, Depends()],
) -> ApiResponse[list[MenuItemView]]:
    return ApiResponse(
        success=True,
        message="Lấy thực đơn thành công",
        data=await service.list_public(poi_id),
    )


@router.get("/categories")
async def filter_poi_category(
    params: Annotated[FilterPoiCategory, Query()],
    poi_category_service: Annotated[PoiCategoryService, Depends()],
) -> ApiResponse[Pagination[ViewPoiCategory]]:

    result = await poi_category_service.filter_poi_category(params)

    return ApiResponse(success=True, message="Lấy danh mục POI thành công", data=result)


@router.get("/poi/load-all", response_model=None)
async def bundle_poi(
    # Params
    lang: str,
    # Service
    content_dataset_version_service: Annotated[ContentDatasetVersionService, Depends()],
    poi_service: Annotated[PoiService, Depends()],
    updated_after: datetime | None = None,
    # Header
    etag: str | None = Header(
        default=None,
        alias="Etag",
    ),
):
    content_dataset_version = await content_dataset_version_service.find_poi_version()
    if content_dataset_version is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Phiên bản dữ liệu POI chưa được khởi tạo",
        )

    public_etag = f"{POI_CACHE_SCHEMA_VERSION}:{content_dataset_version.etag}"
    if public_etag == etag:
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    pois = await poi_service.find_public_pois_changed_between(
        lang=lang,
        # ETag represents the whole public snapshot. When it changes, return
        # every active POI so removed/deactivated records disappear from cache.
        updated_after=None,
    )
    next_updated_after = max(
        (poi.updated_at for poi in pois),
        default=None,
    )

    return ApiResponse[PoiDataset](
        success=True,
        message="Đồng bộ dữ liệu POI thành công",
        data=PoiDataset(
            etag=public_etag,
            updated_after=next_updated_after,
            pois=pois,
        ),
    )
