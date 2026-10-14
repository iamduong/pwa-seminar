import re
from datetime import UTC, datetime

from bson import ObjectId
from core.dependency import MongoDB
from fastapi import HTTPException, status
from model.poi_owner_registration_model import PoiOwnerRegistrationStatus
from repository.admin_user_repository import AdminUserRepository
from repository.poi_owner_registration_repository import PoiOwnerRegistrationReposioty
from schema.admin_schema import AdminUserFilter, UpdatePoiPOwnerRegistration


class AdminService:
    def __init__(self, db: MongoDB):
        self.admin_user_repository = AdminUserRepository(db)
        self.poi_owner_registration_repository = PoiOwnerRegistrationReposioty(db)

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
