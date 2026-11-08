from datetime import datetime

from bson import ObjectId
from core.dependency import MongoDB
from core.pagination import Pagination
from fastapi import HTTPException, status
from model.poi_task_model import PoiTaskModel, PoiTaskStatus
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
