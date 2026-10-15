import re
from datetime import UTC, datetime

from bson import ObjectId
from core.dependency import MongoDB
from fastapi import HTTPException, status
from model.poi_owner_registration_model import PoiOwnerRegistrationStatus
from model.poi_model import PoiModel
from model.poi_submission_model import PoiSubmissionStatus
from repository.admin_user_repository import AdminUserRepository
from repository.poi_repository import PoiRepository
from repository.poi_submission_repository import PoiSubmissionRepository
from repository.poi_owner_registration_repository import PoiOwnerRegistrationReposioty
from repository.role_repository import RoleRepository
from schema.admin_schema import (
    AdminUserFilter,
    PoiSubmissionFilter,
    ReviewPoiSubmission,
    UpdatePoiPOwnerRegistration,
)


class AdminService:
    def __init__(self, db: MongoDB):
        self.admin_user_repository = AdminUserRepository(db)
        self.poi_owner_registration_repository = PoiOwnerRegistrationReposioty(db)
        self.poi_submission_repository = PoiSubmissionRepository(db)
        self.poi_repository = PoiRepository(db)
        self.role_repository = RoleRepository(db)

    """ ------------------------------ Collection: Admin User ------------------------------ """

    async def filter_admin_users(self, filters: AdminUserFilter) -> dict:
        search: dict = {}
        # documents isn't deleted
        search["deleted_at"] = None
        print(f"Query param q: {filters.q}")

        if filters.q is not None:
            keyword = re.escape(filters.q.strip())

            search["$or"] = [
                {
                    "full_name": {"$regex": keyword, "$options": "i"},
                },
                {
                    "email": {"$regex": keyword, "$options": "i"},
                },
                {
                    "phone": {"$regex": keyword, "$options": "i"},
                },
            ]

        if filters.role_id:
            if not ObjectId.is_valid(filters.role_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mã quyền không hợp lệ",
                )
            search["role_id"] = ObjectId(filters.role_id)

        if filters.is_active is not None:
            search["is_active"] = filters.is_active

        if filters.is_poi_owner_verified is not None:
            search["is_poi_owner_verified"] = filters.is_poi_owner_verified

        result = await self.admin_user_repository.find_pagination(
            page=filters.page,
            page_size=filters.page_size,
            search=search,
            sort_by=filters.sort_by,
            sort_order=filters.sort_order,
        )

        return result

    async def get_admin_user_by_id(self, id: str):

        if not ObjectId.is_valid(id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã người dùng không hợp lệ",
            )

        admin_user = await self.admin_user_repository.find_one({"_id": ObjectId(id)})

        if admin_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy người dùng",
            )

    """ ------------------------------ Collection: Poi Owner Registration ------------------------------ """

    async def review_registration(
        self,
        id: str,
        body: UpdatePoiPOwnerRegistration,
    ) -> dict:
        registration_id = ObjectId(id)
        poi_owner_registration = (
            await self.poi_owner_registration_repository.find_by_id(registration_id)
        )

        if poi_owner_registration is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn đăng ký",
            )

        if poi_owner_registration.status != PoiOwnerRegistrationStatus.PENDING.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Đơn đăng ký đã được xử lý",
            )

        admin_user = await self.admin_user_repository.find_one(
            {"_id": poi_owner_registration.user_id}
        )

        if admin_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tài khoản của chủ quán",
            )

        is_approved = body.status == PoiOwnerRegistrationStatus.APPROVED
        user_updates: dict = {
            "is_poi_owner_verified": is_approved,
            "updated_at": datetime.now(UTC),
        }
        if is_approved:
            poi_owner_role = await self.role_repository.find_one({"name": "poi_owner"})
            if poi_owner_role is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Vai trò chủ địa điểm chưa được cấu hình",
                )
            user_updates["role_id"] = poi_owner_role.id

        await self.admin_user_repository.update_by_id(
            poi_owner_registration.user_id,
            user_updates,
        )

        await self.poi_owner_registration_repository.update_by_id(
            registration_id,
            {
                "status": body.status.value,
                "admin_note": body.admin_note or "",
                "updated_at": datetime.now(UTC),
            },
        )

        return {
            "registration_id": id,
            "user_id": str(poi_owner_registration.user_id),
            "status": body.status.value,
            "admin_note": body.admin_note,
            "is_poi_owner_verified": is_approved,
        }

    """ ------------------------------ Collection: Poi Submission ------------------------------ """

    async def filter_poi_submissions(self, filters: PoiSubmissionFilter) -> dict:
        search: dict = {"deleted_at": None}
        if filters.status is not None:
            search["status"] = filters.status.value
        if filters.address:
            search["address"] = {
                "$regex": re.escape(filters.address.strip()),
                "$options": "i",
            }
        if filters.category_id:
            if not ObjectId.is_valid(filters.category_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Danh mục địa điểm không hợp lệ",
                )
            search["category_id"] = ObjectId(filters.category_id)

        result = await self.poi_submission_repository.find_pagination(
            page=filters.page,
            page_size=filters.page_size,
            search=search,
        )
        return result.model_dump()

    async def get_poi_submission(self, submission_id: str) -> dict:
        if not ObjectId.is_valid(submission_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã đơn đăng ký không hợp lệ",
            )

        submission = await self.poi_submission_repository.find_detail(
            ObjectId(submission_id)
        )
        if submission is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn đăng ký địa điểm",
            )
        return submission

    async def review_poi_submission(
        self,
        submission_id: str,
        reviewer_id: str,
        body: ReviewPoiSubmission,
    ) -> dict:
        if not ObjectId.is_valid(submission_id) or not ObjectId.is_valid(reviewer_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã đơn đăng ký không hợp lệ",
            )

        object_id = ObjectId(submission_id)
        submission = await self.poi_submission_repository.find_by_id(object_id)
        if submission is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn đăng ký địa điểm",
            )
        if submission.status != PoiSubmissionStatus.PENDING.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Đơn đăng ký đã được xử lý",
            )

        reviewed_at = datetime.now(UTC)
        poi_id = None
        if body.status == PoiSubmissionStatus.APPROVED:
            poi = PoiModel(
                owner_id=submission.owner_id,
                category_id=submission.category_id,
                name=submission.name,
                description=submission.description,
                address=submission.address,
                location=submission.location,
                images=submission.images,
                trigger_radius=submission.trigger_radius,
                is_active=True,
            )
            poi_result = await self.poi_repository.insert_item(poi.to_dump())
            poi_id = poi_result.inserted_id

        update_result = await self.poi_submission_repository.review_pending(
            object_id,
            {
                "poi_id": poi_id,
                "status": body.status.value,
                "admin_note": body.admin_note or "",
                "reviewed_by": ObjectId(reviewer_id),
                "reviewed_at": reviewed_at,
                "updated_at": reviewed_at,
            },
        )
        if update_result.modified_count == 0:
            if poi_id is not None:
                await self.poi_repository.delete_by_id(poi_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Đơn đăng ký vừa được xử lý bởi quản trị viên khác",
            )

        reviewed = await self.poi_submission_repository.find_detail(object_id)
        if reviewed is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể cập nhật đơn đăng ký",
            )
        return reviewed
