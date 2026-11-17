from typing import Annotated
from uuid import UUID

from core.api_response import ApiResponse
from core.dependency import AccessTokenPayload, require_permission
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query, status
from schema.tour_schema import CreateTour, FilterTour, ViewTour, ViewTourPoi
from service.tour_service import TourService

router = APIRouter(prefix="/tours", tags=["Tours"])


@router.get("/poi-options", dependencies=[Depends(require_permission("tour:create"))])
async def list_tour_poi_options(
    service: Annotated[TourService, Depends()],
) -> ApiResponse[list[ViewTourPoi]]:
    return ApiResponse(
        success=True,
        message="Lấy danh sách POI cho tour thành công",
        data=await service.list_poi_options(),
    )


@router.get("", dependencies=[Depends(require_permission("tour:read"))])
async def filter_tours(
    filters: Annotated[FilterTour, Query()],
    service: Annotated[TourService, Depends()],
) -> ApiResponse[Pagination[ViewTour]]:
    return ApiResponse(
        success=True,
        message="Lấy danh sách tour thành công",
        data=await service.filter_tours(filters),
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_tour(
    body: CreateTour,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("tour:create")),
    ],
    service: Annotated[TourService, Depends()],
) -> ApiResponse[ViewTour]:
    return ApiResponse(
        success=True,
        message="Tạo tour thành công",
        data=await service.create_tour(body, UUID(principal.sub)),
    )


@router.delete("/{tour_id}")
async def delete_tour(
    tour_id: str,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("tour:delete")),
    ],
    service: Annotated[TourService, Depends()],
) -> ApiResponse[None]:
    await service.delete_tour(tour_id, UUID(principal.sub))
    return ApiResponse(success=True, message="Xóa tour thành công")


@router.patch("/{tour_id}/restore")
async def restore_tour(
    tour_id: str,
    principal: Annotated[
        AccessTokenPayload,
        Depends(require_permission("tour:delete")),
    ],
    service: Annotated[TourService, Depends()],
) -> ApiResponse[ViewTour]:
    return ApiResponse(
        success=True,
        message="Khôi phục tour thành công",
        data=await service.restore_tour(tour_id, UUID(principal.sub)),
    )


@router.get("/{code}")
async def detail_pois_tour(
    code: str, service: Annotated[TourService, Depends()]
) -> ApiResponse[ViewTour]:
    tour = await service.find_by_code(code)
    return ApiResponse(
        success=True,
        message="Lấy thông tin tour thành công",
        data=tour,
    )
