from typing import Annotated

from core.api_response import ApiResponse
from core.pagination import Pagination
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from schema.poi_task_schema import FilterPoiTask, ViewPoiTask
from service.poi_task_service import PoiTaskService
from time import monotonic
from datetime import UTC, datetime
import asyncio
from collections.abc import AsyncIterator


router = APIRouter(
    prefix="/poi-tasks",
    tags=["POI Task Controller"],
)


@router.get("")
async def filter_poi_tasks(
    params: Annotated[FilterPoiTask, Query()],
    service: Annotated[PoiTaskService, Depends()],
) -> ApiResponse[Pagination[ViewPoiTask]]:
    result = await service.filter_poi_tasks(params)

    return ApiResponse(
        success=True,
        message="Lấy danh sách tiến trình POI thành công",
        data=result,
    )


@router.get("/stream")
async def stream_poi_tasks(
    request: Request,
    service: Annotated[PoiTaskService, Depends()],
) -> StreamingResponse:
    async def generate_events() -> AsyncIterator[str]:
        last_updated_at = datetime.now(UTC)
        last_heartbeat_at = monotonic()

        yield "event: connected\ndata: {}\n\n"

        while not await request.is_disconnected():
            tasks = await service.find_updated_after(
                last_updated_at
            )

            for task in tasks:
                yield (
                    "event: task.updated\n"
                    f"data: {task.model_dump_json()}\n\n"
                )

            if tasks:
                last_updated_at = max(
                    task.updated_at
                    for task in tasks
                )

            if monotonic() - last_heartbeat_at >= 15:
                yield ": heartbeat\n\n"
                last_heartbeat_at = monotonic()

            await asyncio.sleep(1)

    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/{task_id}")
async def get_poi_task_by_id(
    task_id: str,
    service: Annotated[PoiTaskService, Depends()],
) -> ApiResponse[ViewPoiTask]:
    result = await service.get_poi_task_by_id(task_id)

    return ApiResponse(
        success=True,
        message="Lấy tiến trình POI thành công",
        data=result,
    )


@router.post("/{task_id}/retry")
async def retry_poi_task(
    task_id: str,
    service: Annotated[PoiTaskService, Depends()],
) -> ApiResponse[ViewPoiTask]:
    result = await service.retry_poi_task(task_id)

    return ApiResponse(
        success=True,
        message="Đã đưa tiến trình POI vào hàng đợi retry",
        data=result,
    )
