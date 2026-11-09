from datetime import datetime

from resource.config import MY_MEMORY_LANGUAGES

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from fastapi import HTTPException
from model.poi_model import PoiModel
from model.poi_task_model import PoiTaskModel
from model.poi_task_process_model import PoiTaskProcessModel
from repository.poi_category_repository import PoiCategoryRepository
from repository.poi_repository import PoiRepository
from repository.poi_task_repository import PoiTaskRepository
from schema.poi_dataset_schema import PoiDatasetItem
from schema.poi_schema import (
    FilterOwnerPoi,
    CreateAdminPoi,
    ViewOwnerPoi,
    ViewOwnerPoiDetail,
    ViewOwnerPoiLanguage,
    ViewOwnerPoiTaskSummary,
)


class PoiService:
    def __init__(self, db: PostgresDB):
        self.db = db
        self.repository = PoiRepository(db)
        self.tasks = PoiTaskRepository(db)
        self.categories = PoiCategoryRepository(db)

    @staticmethod
    def _owner_view(model):
        return ViewOwnerPoi(id=str(model.id), category_id=str(model.category_id), category_name=model.category_name, name=model.name, description=model.description, address=model.address, location=model.location_geojson, images=model.images, trigger_radius=model.trigger_radius, is_active=model.is_active, activation_requested=model.activation_requested, audio_priority=model.audio_priority, audio_status=model.audio_status, created_at=model.created_at, updated_at=model.updated_at)

    async def filter_owner_pois(self, filters: FilterOwnerPoi, owner_id: str):
        items, total = await self.repository.find_pagination(filters.page, filters.page_size, owner_id=parse_uuid(owner_id, "Mã chủ quán"), keyword=filters.q)
        return Pagination[ViewOwnerPoi](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._owner_view(x) for x in items])

    async def filter_admin_pois(self, filters: FilterOwnerPoi):
        items, total = await self.repository.list_admin(
            filters.page,
            filters.page_size,
            filters.q,
        )
        return Pagination[ViewOwnerPoi](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._owner_view(item) for item in items],
        )

    async def create_admin_poi(self, body: CreateAdminPoi):
        category = await self.categories.find_by_id(
            parse_uuid(body.category_id, "Mã danh mục")
        )
        if category is None or not category.is_active:
            raise HTTPException(404, "Không tìm thấy danh mục đang hoạt động")

        poi = PoiModel(
            owner_id=None,
            category_id=category.id,
            category_name=category.name,
            name=body.name.strip(),
            description=body.description.strip(),
            address=body.address.strip(),
            location=body.location.model_dump(),
            images=body.images,
            trigger_radius=body.trigger_radius,
            is_active=False,
            activation_requested=body.activation_requested,
            audio_priority=body.audio_priority,
            audio_status="pending",
        )
        await self.repository.insert(poi)

        task = PoiTaskModel(
            poi_id=poi.id,
            type="create",
            status="queued",
            progress_percent=0,
            target_languages=MY_MEMORY_LANGUAGES,
            step_language=None,
            activation_requested=body.activation_requested,
            retry_count=0,
            max_retries=3,
        )
        task.processes = [
            PoiTaskProcessModel(language=language)
            for language in MY_MEMORY_LANGUAGES
        ]
        await self.tasks.insert(task)
        await self.db.commit()
        await self.db.refresh(poi)
        poi.location_geojson = poi.location
        return self._owner_view(poi)

    async def get_owner_poi_detail(self, poi_id: str, owner_id: str):
        parsed_poi_id = parse_uuid(poi_id, "Mã POI")
        model = await self.repository.find_owned_detail(
            parse_uuid(owner_id, "Mã chủ quán"),
            parsed_poi_id,
        )
        if model is None:
            raise HTTPException(404, "Không tìm thấy POI thuộc quyền quản lý của bạn")

        return await self._build_poi_detail(model, parsed_poi_id)

    async def get_admin_poi_detail(self, poi_id: str):
        parsed_poi_id = parse_uuid(poi_id, "Mã POI")
        model = await self.repository.find_detail(parsed_poi_id)
        if model is None:
            raise HTTPException(404, "Không tìm thấy POI")

        return await self._build_poi_detail(model, parsed_poi_id)

    async def _build_poi_detail(self, model, parsed_poi_id):
        latest_task = await self.tasks.find_latest_by_poi(parsed_poi_id)
        processes = {
            process.language: process
            for process in (latest_task.processes if latest_task else [])
        }
        localizations = {
            localization.lang: localization
            for localization in model.localizations
            if localization.deleted_at is None
        }
        language_codes = list(latest_task.target_languages if latest_task else [])
        language_codes.extend(
            lang for lang in localizations if lang not in language_codes
        )

        language_views = []
        for lang in language_codes:
            localization = localizations.get(lang)
            process = processes.get(lang)
            language_views.append(
                ViewOwnerPoiLanguage(
                    lang=lang,
                    category=localization.category if localization else None,
                    name=localization.name if localization else None,
                    description=localization.description if localization else None,
                    translation_status=(
                        process.translation_status
                        if process
                        else "done" if localization else "pending"
                    ),
                    audio_status=(
                        localization.audio_status
                        if localization
                        else process.audio_status if process else "pending"
                    ),
                    audio_url=(
                        localization.audio_url
                        if localization and localization.audio_url
                        else process.audio_url if process else None
                    ),
                    error_message=process.error_message if process else None,
                    updated_at=localization.updated_at if localization else None,
                )
            )

        task_view = (
            ViewOwnerPoiTaskSummary(
                id=str(latest_task.id),
                type=latest_task.type,
                status=latest_task.status,
                progress_percent=latest_task.progress_percent,
                step_language=latest_task.step_language,
                retry_count=latest_task.retry_count,
                max_retries=latest_task.max_retries,
                created_at=latest_task.created_at,
                updated_at=latest_task.updated_at,
            )
            if latest_task
            else None
        )

        return ViewOwnerPoiDetail(
            **self._owner_view(model).model_dump(),
            localizations=language_views,
            latest_task=task_view,
        )

    async def find_public_pois_changed_between(self, lang: str, updated_after: datetime | None):
        rows = await self.repository.find_public_changed(lang, updated_after)
        result = []
        for poi, localization in rows:
            result.append(PoiDatasetItem(id=str(poi.id), category_id=str(poi.category_id), category_name=localization.category if localization else poi.category_name, name=localization.name if localization else poi.name, description=localization.description if localization else poi.description, address=poi.address, location=poi.location, images=poi.images, trigger_radius=poi.trigger_radius, audio_priority=poi.audio_priority, audio_status=localization.audio_status if localization else poi.audio_status, audio_url=localization.audio_url if localization else None, lang=lang, created_at=poi.created_at, updated_at=poi.updated_at))
        return result
