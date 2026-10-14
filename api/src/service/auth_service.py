from datetime import UTC, datetime

import jwt
from bson import ObjectId
from core.dependency import MongoDB
from core.security import (
    TokenType,
    compare_password,
    decode_token,
    encrypt_pii,
    generate_access_token,
    generate_refresh_token,
    hash_password,
)
from fastapi import HTTPException, status
from model.admin_user_model import AdminUserModel
from model.poi_owner_registration_model import (
    PoiOwnerRegistrationModel,
    PoiOwnerRegistrationStatus,
)
from repository.admin_user_repository import AdminUserRepository
from repository.poi_owner_registration_repository import PoiOwnerRegistrationReposioty
from repository.role_repository import RoleRepository
from schema.auth_schema import ChangePassword, Login, RegisterPoiOwner


class AuthService:
    def __init__(self, db: MongoDB):
        self.admin_user_repository = AdminUserRepository(db)
        self.poi_owner_registration_repository = PoiOwnerRegistrationReposioty(db)
        self.role_repository = RoleRepository(db)

    async def _generate_access_token(self, user: AdminUserModel) -> str:
        role_name: str | None = None
        permissions: list[str] = []

        if user.role_id is not None:
            role = await self.role_repository.find_by_id(user.role_id)

            if role is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quyền tài khoản không hợp lệ",
                )

            role_name = role.name
            permissions = role.permissions

        return generate_access_token(
            str(user.id),
            role_name,
            permissions,
            user.is_poi_owner_verified,
        )

    async def register_poi_owner(self, body: RegisterPoiOwner):
        # Check email, phone
        existing = await self.admin_user_repository.find_one(
            {"$or": [{"email": body.email}, {"phone": body.phone}]}
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email hoặc SĐT đã tồn tại",
            )

        poi_owner_role = await self.role_repository.find_one({"name": "poi_owner"})
        if poi_owner_role is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Vai trò chủ doanh nghiệp chưa được cấu hình",
            )

        admin_user_document = AdminUserModel(
            full_name=body.full_name,
            email=body.email,
            phone=body.phone,
            password_hash=hash_password(body.password),
            is_active=True,
            is_poi_owner_verified=False,
            id_card_encrypted=encrypt_pii(body.id_card),
            pii_collected_at=datetime.now(UTC),
            role_id=poi_owner_role.id,
        ).to_dump()

        admin_user_inserted = await self.admin_user_repository.insert_item(
            admin_user_document
        )

        poi_owner_registration_document = PoiOwnerRegistrationModel(
            user_id=admin_user_inserted.inserted_id,
            business_name=body.business_name,
            business_address=body.business_address,
            admin_note="",
            status=PoiOwnerRegistrationStatus.PENDING,
        ).to_dump()

        poi_owner_registration_inserted = (
            await self.poi_owner_registration_repository.insert_item(
                poi_owner_registration_document
            )
        )

        return {
            "admin_user_id": str(admin_user_inserted.inserted_id),
            "poi_owner_registration_id": str(
                poi_owner_registration_inserted.inserted_id
            ),
        }

    async def login(self, body: Login):
        identifier = body.identifier.strip()
        existing = await self.admin_user_repository.find_one(
            {
                "$or": [
                    {"email": identifier.lower()},
                    {"phone": identifier},
                ]
            }
        )

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tài khoản không tồn tại",
            )

        if not compare_password(body.password, existing.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Thông tin đăng nhập không chính xác",
            )

        if not existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tài khoản bị khóa",
            )

        access_token = await self._generate_access_token(existing)
        refresh_token = generate_refresh_token(str(existing.id))

        return {"access_token": access_token, "refresh_token": refresh_token}

    async def get_current_profile(self, user_id: str):
        admin_user = await self.admin_user_repository.find_one(
            {"_id": ObjectId(user_id)}
        )

        if admin_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài khoản"
            )

        role = None
        if admin_user.role_id is not None:
            role = await self.role_repository.find_one({"_id": admin_user.role_id})

        poi_owner_registration = await self.poi_owner_registration_repository.find_one(
            {"user_id": ObjectId(user_id)}
        )

        return {
            "admin_user": admin_user,
            "poi_owner_registration": poi_owner_registration,
            "role": role,
        }

    async def refresh_access_token(self, refresh_token: str | None) -> str:
        if refresh_token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Không tìm thấy refresh token",
            )

        try:
            payload = decode_token(refresh_token, TokenType.REFRESH)
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Phiên đăng nhập đã hết hạn",
            )
        except (jwt.InvalidTokenError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token không chính xác",
            )

        existing = await self.admin_user_repository.find_by_id(ObjectId(payload["sub"]))
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tài khoản không tồn tại",
            )

        if not existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tài khoản bị khóa",
            )

        return await self._generate_access_token(existing)

    async def change_password(self, user_id: str, body: ChangePassword) -> None:
        existing = await self.admin_user_repository.find_by_id(ObjectId(user_id))

        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tài khoản không tồn tại",
            )

        if not compare_password(body.current_password, existing.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu hiện tại không chính xác",
            )

        if body.current_password == body.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu mới phải khác mật khẩu hiện tại",
            )

        result = await self.admin_user_repository.update_by_id(
            existing.id,
            {
                "password_hash": hash_password(body.new_password),
                "updated_at": datetime.now(UTC),
            },
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tài khoản không tồn tại",
            )
