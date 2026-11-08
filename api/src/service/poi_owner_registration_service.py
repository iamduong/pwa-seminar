from datetime import UTC, datetime

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from core.security import encrypt_pii
from fastapi import HTTPException
from model.poi_owner_registration_model import PoiOwnerRegistrationModel, PoiOwnerRegistrationStatus
from repository.admin_user_repository import AdminUserRepository
from repository.poi_owner_registration_repository import PoiOwnerRegistrationRepository
from repository.role_repository import RoleRepository
from schema.poi_owner_registration_schema import FilterPoiOwnerRegistration, ViewPoiOwnerRegistration


class PoiOwnerRegistrationService:
    def __init__(self, db: PostgresDB):
        self.db = db
        self.users = AdminUserRepository(db)
        self.repository = PoiOwnerRegistrationRepository(db)
        self.roles = RoleRepository(db)

    @staticmethod
    def _view(model):
        return ViewPoiOwnerRegistration(id=str(model.id), user_id=str(model.user_id), business_name=model.business_name, business_address=model.business_address, note=model.note, status=model.status, admin_note=model.admin_note, created_at=model.created_at, updated_at=model.updated_at)

    async def filter_poi_owner_registration(self, filters: FilterPoiOwnerRegistration):
        items, total = await self.repository.find_pagination(filters.page, filters.page_size, status=filters.status, keyword=filters.q)
        return Pagination[ViewPoiOwnerRegistration](page=filters.page, page_size=filters.page_size, total_item=total, total_page=(total + filters.page_size - 1) // filters.page_size, data=[self._view(x) for x in items])

    async def review_registration(self, registration_id: str, body: dict):
        registration = await self.repository.find_by_id(parse_uuid(registration_id, "Mã đơn đăng ký"))
        if registration is None:
            raise HTTPException(404, "Không tìm thấy đơn đăng ký")
        if registration.status != PoiOwnerRegistrationStatus.PENDING.value:
            raise HTTPException(409, "Đơn đăng ký đã được xử lý")
        user = await self.users.find_by_id(registration.user_id)
        if user is None:
            raise HTTPException(404, "Không tìm thấy tài khoản của chủ quán")
        approved = body["status"] == PoiOwnerRegistrationStatus.APPROVED.value
        if approved:
            role = await self.roles.find_by_name("poi_owner")
            if role is None:
                raise HTTPException(503, "Vai trò chủ địa điểm chưa được cấu hình")
            user.role_id = role.id
        user.is_poi_owner_verified = approved
        registration.status = body["status"]
        registration.admin_note = body.get("admin_note") or ""
        await self.users.update(user)
        await self.repository.update(registration)
        return {"registration_id": str(registration.id), "user_id": str(user.id), "status": registration.status, "admin_note": registration.admin_note, "is_poi_owner_verified": approved}

    async def register_poi_owner(self, user_id: str, body: dict):
        user_uuid = parse_uuid(user_id, "Mã tài khoản")
        existing = await self.repository.find_by_user(user_uuid)
        if existing and existing[0].status in ("pending", "approved"):
            raise HTTPException(409, "Tài khoản đã gửi hồ sơ đăng ký chủ địa điểm")
        user = await self.users.find_by_id(user_uuid)
        if user is None or not user.is_active:
            raise HTTPException(409, "Không thể thực hiện đăng ký")
        user.id_card_encrypted = encrypt_pii(body["id_card"])
        user.pii_collected_at = datetime.now(UTC)
        registration = PoiOwnerRegistrationModel(user_id=user.id, admin_note="", business_name=body["business_name"].strip(), business_address=body["business_address"].strip(), note=body["note"].strip(), status="pending")
        await self.users.update(user)
        registration = await self.repository.insert(registration)
        return {"registration_id": str(registration.id), "status": registration.status}

    async def self_registration(self, user_id: str):
        items = await self.repository.find_by_user(parse_uuid(user_id, "Mã tài khoản"))
        return [self._view(x) for x in items]
