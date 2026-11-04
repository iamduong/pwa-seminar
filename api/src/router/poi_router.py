from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query
from schema.poi_schema import FilterOwnerPoi, ViewOwnerPoi
from service.poi_service import PoiService


router = APIRouter(prefix="/pois", tags=["POI Controller"])


@router.get("/mine")
async def filter_my_pois(
    params: Annotated[FilterOwnerPoi, Query()],
    principal: Annotated[AccessTokenPayload, Depends(require_permission("owner:poi_read"))],
    poi_service: Annotated[PoiService, Depends()],
) -> ApiResponse[Pagination[ViewOwnerPoi]]:
    result = await poi_service.filter_owner_pois(params, principal.sub)

    return ApiResponse(success=True, message="Lấy POI của bạn thành công", data=result)
