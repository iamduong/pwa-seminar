from typing import Annotated

from core.api_response import ApiResponse
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query
from schema.poi_category_schema import FilterPoiCategory, ViewPoiCategory
from service.poi_category_service import PoiCategoryService

router = APIRouter(prefix="/public", tags=["Category Controller"])

""" Public router note
- All resources in public router can be accessed without role
- ...
"""


@router.get("/categories")
async def filter_poi_category(
    params: Annotated[FilterPoiCategory, Query()],
    poi_category_service: Annotated[PoiCategoryService, Depends()],
) -> ApiResponse[Pagination[ViewPoiCategory]]:

    result = await poi_category_service.filter_poi_category(params)

    return ApiResponse(success=True, message="Lấy danh mục POI thành công", data=result)


@router.get("/dashboard-features")
async def dashboard_feature():
    pass
