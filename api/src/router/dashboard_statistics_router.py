from typing import Annotated

from core.api_response import ApiResponse
from core.dependency import require_permission
from fastapi import APIRouter, Depends, Query
from schema.dashboard_statistics_schema import (
    FilterDashboardStatistics,
    ViewAudioStatistics,
    ViewConnectionStatistics,
    ViewDashboardStatistics,
)
from service.dashboard_statistics_service import DashboardStatisticsService


router = APIRouter(
    prefix="/dashboard/statistics",
    tags=["Dashboard Statistics"],
)


@router.get(
    "",
    dependencies=[
        Depends(require_permission("poi:read")),
        Depends(require_permission("poi_submission:monitor")),
    ],
)
async def get_dashboard_statistics(
    filters: Annotated[FilterDashboardStatistics, Query()],
    service: Annotated[DashboardStatisticsService, Depends()],
) -> ApiResponse[ViewDashboardStatistics]:
    return ApiResponse(
        success=True,
        message="Lấy thống kê dashboard thành công",
        data=await service.get_statistics(filters),
    )


@router.get(
    "/connections",
    dependencies=[Depends(require_permission("poi:read"))],
)
async def get_connection_statistics(
    filters: Annotated[FilterDashboardStatistics, Query()],
    service: Annotated[DashboardStatisticsService, Depends()],
) -> ApiResponse[ViewConnectionStatistics]:
    return ApiResponse(
        success=True,
        message="Lấy thống kê lượt kết nối thành công",
        data=await service.get_connection_statistics(filters),
    )


@router.get(
    "/audio-plays",
    dependencies=[Depends(require_permission("poi:read"))],
)
async def get_audio_statistics(
    service: Annotated[DashboardStatisticsService, Depends()],
) -> ApiResponse[ViewAudioStatistics]:
    return ApiResponse(
        success=True,
        message="Lấy thống kê lượt nghe audio thành công",
        data=await service.get_audio_statistics(),
    )
