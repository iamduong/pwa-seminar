import re
from datetime import UTC, datetime
from resource.config import MY_MEMORY_LANGUAGES

from bson import ObjectId
from core.dependency import MongoDB
from core.pagination import Pagination
from fastapi import HTTPException, status
from model.poi_model import PoiModel
from model.poi_submission_model import PoiSubmissionModel, PoiSubmissionStatus
from model.poi_task_model import PoiTaskModel, PoiTaskStatus, PoiTaskType, Process
from repository.admin_user_repository import AdminUserRepository
from repository.poi_category_repository import PoiCategoryRepository
from repository.poi_repository import PoiRepository
from repository.poi_submission_repository import PoiSubmissionRepository
from repository.poi_task_repository import PoiTaskRepository
from schema.poi_submission_shema import (
    FilterPoiSubmission,
    RegisterPoiSubmission,
    ReviewPoiSubmission,
    ViewPoiSubmission,
)
from service.content_dataset_version_service import ContentDatasetVersionService


class PoiSubmissionService:
    def __init__(self, db: MongoDB):
        self.poi_submission_repository = PoiSubmissionRepository(db)
        self.admin_user_repository = AdminUserRepository(db)
        self.poi_category_repository = PoiCategoryRepository(db)
        self.poi_repository = PoiRepository(db)
        self.poi_task_repository = PoiTaskRepository(db)
        self.content_dataset_version_service = ContentDatasetVersionService(db)

    def _to_view(self, model: PoiSubmissionModel) -> ViewPoiSubmission:
        return ViewPoiSubmission(
            id=str(model.id),
            owner_id=str(model.owner_id),
            poi_id=str(model.poi_id) if model.poi_id is not None else None,
            submission_type=model.submission_type,
            category_id=str(model.category_id),
            category_name=model.category_name,
            name=model.name,
            description=model.description,
            address=model.address,
            location=model.location,
            images=model.images,
            trigger_radius=model.trigger_radius,
            owner_note=model.owner_note,
            status=model.status,
            admin_note=model.admin_note,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    # Filter poi submission
    async def filter_poi_submission(
        self, filters: FilterPoiSubmission
    ) -> Pagination[ViewPoiSubmission]:
        return await self._filter_poi_submission(filters)

    async def filter_owner_poi_submission(
        self, filters: FilterPoiSubmission, owner_id: str
    ) -> Pagination[ViewPoiSubmission]:
        return await self._filter_poi_submission(filters, ObjectId(owner_id))

    async def _filter_poi_submission(
        self, filters: FilterPoiSubmission, owner_id: ObjectId | None = None
    ) -> Pagination[ViewPoiSubmission]:
        conditions: list[dict] = [{"deleted_at": None}]

        if owner_id is not None:
            conditions.append({"owner_id": owner_id})

        if filters.q:
            keyword = re.escape(filters.q.strip())
            if keyword:
                conditions.append(
                    {
                        "$or": [
                            {"name": {"$regex": keyword, "$options": "i"}},
                            {"address": {"$regex": keyword, "$options": "i"}},
                        ]
                    }
                )

        if filters.address:
            address = re.escape(filters.address.strip())
            if address:
                conditions.append({"address": {"$regex": address, "$options": "i"}})

        if filters.category_id:
            conditions.append({"category_id": ObjectId(filters.category_id)})

        if filters.status:
            conditions.append({"status": filters.status.value})

        pipeline = [{"$match": {"$and": conditions}}]
        total_item = await self.poi_submission_repository.count_filter(pipeline)
        submissions = await self.poi_submission_repository.find_pagination(
            pipeline, filters.page, filters.page_size
        )
        total_page = (total_item + filters.page_size - 1) // filters.page_size

        return Pagination[ViewPoiSubmission](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[self._to_view(submission) for submission in submissions],
        )

    # Get poi submission by id
    async def get_poi_submission_by_id(
        self, poi_submission_id: str
    ) -> ViewPoiSubmission:
        submission = await self.poi_submission_repository.find_one(
            {
                "_id": ObjectId(poi_submission_id),
                "deleted_at": None,
            }
        )

        if submission is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đăng ký POI",
            )

        return self._to_view(submission)

    # Reiview poi submission
    async def review_poi_submission(
        self, poi_submission_id: str, body: ReviewPoiSubmission
    ) -> ViewPoiSubmission:
        submission = await self.poi_submission_repository.find_one(
            {
                "_id": ObjectId(poi_submission_id),
                "status": "pending",
            }
        )

        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hoặc đơn đã xử lý",
            )

        updated_at = datetime.now(UTC)
        submission.status = body.status
        submission.admin_note = body.admin_note
        submission.updated_at = updated_at

        if body.status == PoiSubmissionStatus.APPROVED:
            poi = PoiModel(
                owner_id=submission.owner_id,
                category_id=submission.category_id,
                category_name=submission.category_name,
                name=submission.name,
                description=submission.description,
                address=submission.address,
                location=submission.location,
                images=submission.images,
                trigger_radius=submission.trigger_radius,
                activation_requested=body.activation_requested,
                audio_priority=body.audio_priority,
            )
            result = await self.poi_repository.insert_item(poi.to_dump())
            await self.content_dataset_version_service.rotate_poi_etag()
            submission.poi_id = result.inserted_id

            processes = [
                Process(
                    language=language,
                )
                for language in MY_MEMORY_LANGUAGES
            ]

            poi_task = PoiTaskModel(
                poi_id=result.inserted_id,
                type=PoiTaskType.CREATE,
                status=PoiTaskStatus.QUEUED,
                progress_percent=0,
                target_languages=MY_MEMORY_LANGUAGES,
                step_language=None,
                activation_requested=body.activation_requested,
                events=[],
                processes=processes,
            )

            await self.poi_task_repository.insert_item(poi_task.to_dump())

        submission_update = submission.to_dump()
        submission_update.pop("_id")

        await self.poi_submission_repository.update_by_id(
            submission.id, submission_update
        )

        return self._to_view(submission)

    # Register new poi submission and wait for reviewing
    async def register_poi_submission(
        self, body: RegisterPoiSubmission, user_id: str
    ) -> ViewPoiSubmission:
        owner_id = ObjectId(user_id)
        admin_user = await self.admin_user_repository.find_one(
            {"_id": owner_id, "deleted_at": None}
        )

        if admin_user is None or not admin_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tài khoản đang hoạt động",
            )

        category_id = ObjectId(body.category_id)
        category = await self.poi_category_repository.find_one(
            {"_id": category_id, "is_active": True, "deleted_at": None}
        )

        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy danh mục POI",
            )

        submission = PoiSubmissionModel(
            owner_id=owner_id,
            category_id=category.id,
            category_name=category.name,
            name=body.name.strip(),
            description=body.description.strip(),
            address=body.address.strip(),
            location=body.location,
            images=body.images,
            trigger_radius=body.trigger_radius,
            owner_note=body.owner_note.strip(),
            admin_note=None,
        )
        result = await self.poi_submission_repository.insert_item(submission.to_dump())
        submission.id = result.inserted_id

        return self._to_view(submission)
