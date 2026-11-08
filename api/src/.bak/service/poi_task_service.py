from datetime import UTC, datetime

from bson import ObjectId
from core.dependency import MongoDB
from core.pagination import Pagination
from fastapi import HTTPException, status
from model.poi_task_model import Event, PoiTaskModel, PoiTaskStatus, ProcessStatus
from repository.poi_task_repository import PoiTaskRepository
from schema.poi_task_schema import FilterPoiTask, ViewPoiTask

class PoiTaskService:
    def __init__(self, db: MongoDB):
        self.poi_task_repository = PoiTaskRepository(db)

    def _to_view(
        self,
        task: PoiTaskModel
    ) -> ViewPoiTask:
        return ViewPoiTask(
            id=str(task.id),
            poi_id=str(task.poi_id),
            type=task.type,
            status=task.status,
            progress_percent=task.progress_percent,
            target_languages=task.target_languages,
            step_language=task.step_language,
            activation_requested=task.activation_requested,
            retry_count=task.retry_count,
            max_retries=task.max_retries,
            events=task.events,
            processes=task.processes,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )

    async def filter_poi_tasks(
        self,
        filters: FilterPoiTask,
    ) -> Pagination[ViewPoiTask]:
        condition: dict = {
            "deleted_at": None,
        }

        if filters.view_status == "done":
            condition["status"] = PoiTaskStatus.DONE.value

        elif filters.view_status == "processing":
            condition["status"] = {
                "$in": [
                    PoiTaskStatus.RUNNING.value,
                    PoiTaskStatus.QUEUED.value,
                ]
            }

        elif filters.view_status == "failed":
            condition["status"] = PoiTaskStatus.FAILED.value

        total_item = await self.poi_task_repository.count_filter(condition)

        tasks = await self.poi_task_repository.find_pagination(
            condition,
            filters.page,
            filters.page_size
        )
        total_page = (
            total_item + filters.page_size - 1
        ) // filters.page_size

        return Pagination[ViewPoiTask](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[
                self._to_view(task)
                for task in tasks
            ],
        )

    async def get_poi_task_by_id(
        self,
        task_id: str,
    ) -> ViewPoiTask:
        task = await self.poi_task_repository.find_one(
            {
                "_id": ObjectId(task_id),
                "deleted_at": None,
            }
        )

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tiến trình POI",
            )

        return self._to_view(task)

    async def retry_poi_task(
        self,
        task_id: str,
    ) -> ViewPoiTask:
        object_id = ObjectId(task_id)
        task = await self.poi_task_repository.find_one(
            {
                "_id": object_id,
                "deleted_at": None,
            }
        )

        if task is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tiến trình POI",
            )
        if task.status != PoiTaskStatus.FAILED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Chỉ có thể retry tiến trình đã thất bại",
            )

        for process in task.processes:
            if process.translation_status == ProcessStatus.FAILED:
                process.translation_status = ProcessStatus.PENDING
            if process.audio_status == ProcessStatus.FAILED:
                process.audio_status = ProcessStatus.PENDING
            process.error_message = None

        completed_steps = sum(
            process.translation_status == ProcessStatus.DONE
            for process in task.processes
        ) + sum(
            process.audio_status == ProcessStatus.DONE
            for process in task.processes
        )
        total_steps = max(len(task.target_languages) * 2, 1)
        now = datetime.now(UTC)
        task.status = PoiTaskStatus.QUEUED
        task.retry_count = 0
        task.progress_percent = min(completed_steps * 100 // total_steps, 100)
        task.step_language = None
        task.updated_at = now
        task.events.append(
            Event(message="Retry thủ công; task được đưa lại vào hàng đợi", started_at=now)
        )

        retried_task = await self.poi_task_repository.retry_failed(
            object_id,
            task,
        )
        if retried_task is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Trạng thái tiến trình đã thay đổi, vui lòng tải lại",
            )

        return self._to_view(retried_task)

    async def find_updated_after(
        self,
        updated_after: datetime
    ) -> list[ViewPoiTask]:
        tasks = (
            await self.poi_task_repository.find_updated_after(updated_after)
        )

        return [
            self._to_view(task)
            for task in tasks
        ]
