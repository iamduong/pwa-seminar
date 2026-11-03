import re
from datetime import UTC, datetime

from bson import ObjectId
from core.dependency import MongoDB
from core.pagination import Pagination
from core.security import encrypt_pii
from fastapi import HTTPException, status
from model.poi_owner_registration_model import (
    PoiOwnerRegistrationModel,
    PoiOwnerRegistrationStatus,
)
from repository.admin_user_repository import AdminUserRepository
from repository.poi_owner_registration_repository import PoiOwnerRegistrationReposioty
from repository.role_repository import RoleRepository
from schema.poi_owner_registration_schema import (
    FilterPoiOwnerRegistration,
    ViewPoiOwnerRegistration,
)


class PoiOwnerRegistrationService:
    def __init__(self, db: MongoDB):
        self.admin_user_repository = AdminUserRepository(db)
        self.poi_owner_registration_repository = PoiOwnerRegistrationReposioty(db)
        self.role_repository = RoleRepository(db)

    # Method: Filter Poi Owner Registration
    async def filter_poi_owner_registration(
        self,
        filters: FilterPoiOwnerRegistration,
    ) -> Pagination[ViewPoiOwnerRegistration]:
        pipeline: list[dict] = []

        if filters.q:
            keyword = filters.q.strip()
            pipeline.append(
                {
                    "$match": {
                        "$or": [
                            {
                                "business_name": {
                                    "$regex": re.escape(keyword),
                                    "$options": "i",
                                }
                            },
                            {
                                "business_address": {
                                    "$regex": re.escape(keyword),
                                    "$options": "i",
                                }
                            },
                        ],
                    }
                }
            )

        if filters.status:
            pipeline.append(
                {
                    "$match": {
                        "status": filters.status,
                        "deleted_at": None,
                    }
                }
            )

        total_item = await self.poi_owner_registration_repository.count_filter(pipeline)
        poi_owner_registrations = (
            await self.poi_owner_registration_repository.find_pagination(
                pipeline=pipeline, page=filters.page, page_size=filters.page_size
            )
        )

        print(poi_owner_registrations)

        total_page = (total_item + filters.page_size - 1) // filters.page_size

        return Pagination[ViewPoiOwnerRegistration](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total_item,
            total_page=total_page,
            data=[
                ViewPoiOwnerRegistration(
                    id=str(poi_owner_registration.id),
                    user_id=str(poi_owner_registration.user_id),
                    business_name=poi_owner_registration.business_name,
                    business_address=poi_owner_registration.business_address,
                    note=poi_owner_registration.note,
                    status=poi_owner_registration.status,
                    admin_note=poi_owner_registration.admin_note,
                    created_at=poi_owner_registration.created_at,
                    updated_at=poi_owner_registration.updated_at,
                )
                for poi_owner_registration in poi_owner_registrations
            ],
        )

    # Method: Review Poi Owner Registration
    async def review_registration(
        self, poi_owner_registration_id: str, body: dict
    ) -> dict:
        # Validate poi owner registration
        poi_owner_registration = await self.poi_owner_registration_repository.find_one(
            {"_id": ObjectId(poi_owner_registration_id)}
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
        # Validate admin user
        admin_user = await self.admin_user_repository.find_one(
            {"_id": poi_owner_registration.user_id}
        )

        if admin_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy tài khoản của chủ quán",
            )
        # Update resource
        is_approved = body["status"] == PoiOwnerRegistrationStatus.APPROVED

        admin_user_updated: dict = {}
        admin_user_updated["is_poi_owner_verified"] = is_approved
        admin_user_updated["updated_at"] = datetime.now(UTC)

        if is_approved:
            role = await self.role_repository.find_one({"name": "poi_owner"})
            if role is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Vai trò chủ địa điểm chưa được cấu hình",
                )
            admin_user_updated["role_id"] = role.id

        await self.admin_user_repository.update_by_id(
            poi_owner_registration.user_id, admin_user_updated
        )

        poi_owner_registration_updated: dict = {}
        poi_owner_registration["status"] = body["status"]
        poi_owner_registration["admin_note"] = body["admin_note"] or ""
        poi_owner_registration["updated_at"] = datetime.now(UTC)

        await self.poi_owner_registration_repository.update_by_id(
            poi_owner_registration.id, poi_owner_registration_updated
        )

        return {
            "registration_id": poi_owner_registration.id,
            "user_id": poi_owner_registration.user_id,
            "status": body["status"],
            "admin_note": body["admin_note"],
            "is_poi_owner_verified": is_approved,
        }

    # Method: Register Poi Owner
    async def register_poi_owner(self, user_id: str, body: dict) -> dict:
        # Validate poi owner registration
        poi_owner_registration = await self.poi_owner_registration_repository.find_one(
            {"user_id": ObjectId(user_id)}
        )

        if poi_owner_registration is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Tài khoản đã gửi hồ sơ đăng ký chủ địa điểm",
            )
        # Validate admin user
        admin_user = await self.admin_user_repository.find_one(
            {"_id": ObjectId(user_id)}
        )

        if admin_user is None or not admin_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Không thể thực hiện đăng ký",
            )
        # Update resource
        admin_user_updated: dict = {}
        admin_user_updated["id_card_encrypted"] = encrypt_pii(body["id_card"])
        admin_user_updated["pii_collected_at"] = datetime.now(UTC)
        admin_user_updated["updated_at"] = datetime.now(UTC)

        await self.admin_user_repository.update_by_id(admin_user.id, admin_user_updated)

        # Create resource
        poi_owner_registration_inserted = PoiOwnerRegistrationModel(
            user_id=admin_user.id,
            admin_note="",
            business_name=body["business_name"],
            business_address=body["business_address"],
            note=body["note"],
            status=PoiOwnerRegistrationStatus.PENDING.value,
        )

        result_inserted = await self.poi_owner_registration_repository.insert_item(
            poi_owner_registration_inserted.to_dump()
        )

        return {
            "registration_id": str(result_inserted.inserted_id),
            "status": poi_owner_registration_inserted.status,
        }

    # Method: Get self registrations
    async def self_registration(self, user_id: str):
        # Do later
        pass
