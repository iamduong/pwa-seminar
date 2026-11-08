from datetime import UTC, datetime

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from fastapi import HTTPException
from model.poi_task_event_model import PoiTaskEventModel
from model.poi_task_model import PoiTaskStatus
from model.poi_task_process_model import ProcessStatus
from repository.poi_task_repository import PoiTaskRepository
from schema.poi_task_schema import FilterPoiTask, ViewPoiTask


class PoiTaskService:
    def __init__(self, db: PostgresDB):
        self.repository = PoiTaskRepository(db)

    @staticmethod
    def _view(task):
        return ViewPoiTask(id=str(task.id), poi_id=str(task.poi_id), type=task.type, status=task.status, progress_percent=task.progress_percent, target_languages=task.target_languages, step_language=task.step_language, activation_requested=task.activation_requested, retry_count=task.retry_count, max_retries=task.max_retries, events=task.events, processes=task.processes, created_at=task.created_at, updated_at=task.updated_at)

    async def filter_poi_tasks(self, filters: FilterPoiTask):
        statuses = {"done": ["done"], "processing": ["running", "queued"], "failed": ["failed"]}.get(filters.view_status)
        tasks, total = await self.repository.find_pagination(filters.page, filters.page_size, statuses)
        return Pagination[ViewPoiTask](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._view(x) for x in tasks])

    async def get_poi_task_by_id(self, task_id: str):
        task = await self.repository.find_by_id(parse_uuid(task_id, "Mã tiến trình"))
        if task is None:
            raise HTTPException(404, "Không tìm thấy tiến trình POI")
        return self._view(task)

    async def retry_poi_task(self, task_id: str):
        task = await self.repository.find_by_id(parse_uuid(task_id, "Mã tiến trình"))
        if task is None:
            raise HTTPException(404, "Không tìm thấy tiến trình POI")
        if task.status != PoiTaskStatus.FAILED.value:
            raise HTTPException(409, "Chỉ có thể retry tiến trình đã thất bại")
        for process in task.processes:
            if process.translation_status == ProcessStatus.FAILED.value:
                process.translation_status = ProcessStatus.PENDING.value
            if process.audio_status == ProcessStatus.FAILED.value:
                process.audio_status = ProcessStatus.PENDING.value
            process.error_message = None
        done = sum(x.translation_status == "done" for x in task.processes) + sum(x.audio_status == "done" for x in task.processes)
        task.status, task.retry_count, task.step_language = "queued", 0, None
        task.progress_percent = min(done * 100 // max(len(task.target_languages) * 2, 1), 100)
        task.events.append(PoiTaskEventModel(message="Retry thủ công; task được đưa lại vào hàng đợi", started_at=datetime.now(UTC)))
        saved = await self.repository.save(task)
        return self._view(saved)

    async def find_updated_after(self, updated_after: datetime):
        return [self._view(x) for x in await self.repository.find_updated_after(updated_after)]
