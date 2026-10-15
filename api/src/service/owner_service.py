from bson import ObjectId
from core.dependency import MongoDB
from core.security import encrypt_pii
from datetime import UTC, datetime
from fastapi import HTTPException, status
from model.poi_submission_model import PoiSubmissionModel
from model.poi_owner_registration_model import (
    PoiOwnerRegistrationModel,
    PoiOwnerRegistrationStatus,
)
from repository.admin_user_repository import AdminUserRepository
from repository.poi_submission_repository import PoiSubmissionRepository
from repository.poi_repository import PoiRepository
from repository.poi_owner_registration_repository import PoiOwnerRegistrationReposioty
from schema.owner_schema import CreateOwnerRegistration, CreatePoiSubmission


class OwnerService:
    def __init__(self, db: MongoDB):
        self.db = db
        self.admin_user_repository = AdminUserRepository(db)
        self.poi_owner_registration_repository = PoiOwnerRegistrationReposioty(db)
        self.poi_submission_repository = PoiSubmissionRepository(db)
        self.poi_repository = PoiRepository(db)

    async def create_registration(
        self, user_id: str, body: CreateOwnerRegistration
    ) -> dict[str, str]:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã người dùng không hợp lệ",
            )

        user_object_id = ObjectId(user_id)
        existing = await self.poi_owner_registration_repository.find_one(
            {"user_id": user_object_id}
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tài khoản đã gửi hồ sơ đăng ký chủ địa điểm",
            )

        user = await self.admin_user_repository.find_by_id(user_object_id)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tài khoản",
            )

        registration = PoiOwnerRegistrationModel(
            user_id=user_object_id,
            business_name=body.business_name,
            business_address=body.business_address,
            admin_note="",
            status=PoiOwnerRegistrationStatus.PENDING,
        )
        result = await self.poi_owner_registration_repository.insert_item(
            registration.to_dump()
        )
        await self.admin_user_repository.update_by_id(
            user_object_id,
            {
                "id_card_encrypted": encrypt_pii(body.id_card),
                "pii_collected_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            },
        )

        return {"registration_id": str(result.inserted_id)}

    async def get_registration_status(self, user_id: str) -> PoiOwnerRegistrationModel:
        poi_owner_registration = await self.poi_owner_registration_repository.find_one(
            {"user_id": ObjectId(user_id)}
        )

        if poi_owner_registration is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tài khoản chưa đăng ký doanh nghiệp",
            )

        return poi_owner_registration

    async def create_poi_submission(
        self, owner_id: str, body: CreatePoiSubmission
    ) -> dict:
        if not ObjectId.is_valid(owner_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã chủ quán không hợp lệ",
            )

        owner_object_id = ObjectId(owner_id)
        owner = await self.db["admin_user"].find_one({
            "_id": owner_object_id,
            "is_active": True,
            "deleted_at": None,
        })
        if owner is None or not owner.get("is_poi_owner_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản chủ quán chưa được xác minh",
            )
        if not ObjectId.is_valid(body.category_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Danh mục địa điểm không hợp lệ",
            )

        category_id = ObjectId(body.category_id)
        category = await self.db["poi_category"].find_one({
            "_id": category_id,
            "is_active": True,
            "deleted_at": None,
        })
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy danh mục địa điểm",
            )

        submission = PoiSubmissionModel(
            owner_id=owner_object_id,
            category_id=category_id,
            name=body.name,
            description=body.description,
            address=body.address,
            location=body.location,
            images=body.images,
            trigger_radius=body.trigger_radius,
            owner_note=body.owner_note,
        )
        result = await self.poi_submission_repository.insert_item(submission.to_dump())
        created = await self.poi_submission_repository.find_detail(result.inserted_id)

        if created is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Không thể tạo đơn đăng ký địa điểm",
            )
        return created

    async def get_poi_submissions(self, owner_id: str) -> list[dict]:
        if not ObjectId.is_valid(owner_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã chủ quán không hợp lệ",
            )
        return await self.poi_submission_repository.find_owner_submissions(
            ObjectId(owner_id)
        )

    async def get_owner_pois(self, owner_id: str) -> list[dict]:
        if not ObjectId.is_valid(owner_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã chủ quán không hợp lệ",
            )
        return await self.poi_repository.find_owner_pois(ObjectId(owner_id))

    async def get_owner_poi(self, owner_id: str, poi_id: str) -> dict:
        if not ObjectId.is_valid(owner_id) or not ObjectId.is_valid(poi_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mã địa điểm không hợp lệ",
            )

        poi = await self.poi_repository.find_owner_poi(
            ObjectId(poi_id), ObjectId(owner_id)
        )
        if poi is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy địa điểm",
            )
        return poi
