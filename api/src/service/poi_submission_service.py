from resource.config import MY_MEMORY_LANGUAGES

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from fastapi import HTTPException
from model.poi_model import PoiModel
from model.poi_submission_model import PoiSubmissionModel
from model.poi_task_model import PoiTaskModel
from model.poi_task_process_model import PoiTaskProcessModel
from repository.admin_user_repository import AdminUserRepository
from repository.poi_category_repository import PoiCategoryRepository
from repository.poi_repository import PoiRepository
from repository.poi_submission_repository import PoiSubmissionRepository
from repository.poi_task_repository import PoiTaskRepository
from schema.poi_submission_shema import FilterPoiSubmission, RegisterPoiSubmission, ReviewPoiSubmission, ViewPoiSubmission


def point_value(location):
    return location.model_dump()


class PoiSubmissionService:
    def __init__(self, db: PostgresDB):
        self.db = db
        self.repository = PoiSubmissionRepository(db)
        self.users = AdminUserRepository(db)
        self.categories = PoiCategoryRepository(db)
        self.pois = PoiRepository(db)
        self.tasks = PoiTaskRepository(db)

    @staticmethod
    def _view(model):
        return ViewPoiSubmission(id=str(model.id), owner_id=str(model.owner_id), poi_id=str(model.poi_id) if model.poi_id else None, submission_type=model.submission_type, category_id=str(model.category_id), category_name=model.category_name, name=model.name, description=model.description, address=model.address, location=model.location_geojson, images=model.images, trigger_radius=model.trigger_radius, owner_note=model.owner_note, status=model.status, admin_note=model.admin_note, created_at=model.created_at, updated_at=model.updated_at)

    async def _filter(self, filters, owner_id=None):
        category_id = parse_uuid(filters.category_id, "Mã danh mục") if filters.category_id else None
        items, total = await self.repository.find_pagination(filters.page, filters.page_size, owner_id=owner_id, keyword=filters.q, address=filters.address, category_id=category_id, status=filters.status.value if filters.status else None)
        return Pagination[ViewPoiSubmission](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._view(x) for x in items])

    async def filter_poi_submission(self, filters: FilterPoiSubmission):
        return await self._filter(filters)

    async def filter_owner_poi_submission(self, filters: FilterPoiSubmission, owner_id: str):
        return await self._filter(filters, parse_uuid(owner_id, "Mã chủ quán"))

    async def get_poi_submission_by_id(self, submission_id: str):
        model = await self.repository.find_by_id(parse_uuid(submission_id, "Mã đăng ký POI"))
        if model is None:
            raise HTTPException(404, "Không tìm thấy đăng ký POI")
        return self._view(model)

    async def register_poi_submission(self, body: RegisterPoiSubmission, user_id: str):
        owner_id = parse_uuid(user_id, "Mã chủ quán")
        user = await self.users.find_by_id(owner_id)
        if user is None or not user.is_active:
            raise HTTPException(404, "Không tìm thấy tài khoản đang hoạt động")
        category = await self.categories.find_by_id(parse_uuid(body.category_id, "Mã danh mục"))
        if category is None or not category.is_active:
            raise HTTPException(404, "Không tìm thấy danh mục POI")
        model = PoiSubmissionModel(owner_id=owner_id, category_id=category.id, category_name=category.name, name=body.name.strip(), description=body.description.strip(), address=body.address.strip(), location=point_value(body.location), images=body.images, trigger_radius=body.trigger_radius, owner_note=body.owner_note.strip(), admin_note=None)
        model = await self.repository.insert(model)
        model.location_geojson = body.location.model_dump()
        return self._view(model)

    async def review_poi_submission(self, submission_id: str, body: ReviewPoiSubmission):
        model = await self.repository.find_by_id(parse_uuid(submission_id, "Mã đăng ký POI"), pending=True)
        if model is None:
            raise HTTPException(404, "Không tìm thấy đơn hoặc đơn đã xử lý")
        model.status, model.admin_note = body.status, body.admin_note
        if body.status == "approved":
            poi = PoiModel(owner_id=model.owner_id, category_id=model.category_id, category_name=model.category_name, name=model.name, description=model.description, address=model.address, location=model.location, images=model.images, trigger_radius=model.trigger_radius, activation_requested=body.activation_requested, audio_priority=body.audio_priority)
            await self.pois.insert(poi)
            model.poi_id = poi.id
            task = PoiTaskModel(poi_id=poi.id, type="create", status="queued", progress_percent=0, target_languages=MY_MEMORY_LANGUAGES, step_language=None, activation_requested=body.activation_requested, retry_count=0, max_retries=3)
            task.processes = [PoiTaskProcessModel(language=language) for language in MY_MEMORY_LANGUAGES]
            await self.tasks.insert(task)
        await self.repository.save(model)
        refreshed = await self.repository.find_by_id(model.id)
        return self._view(refreshed)
