import jwt

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.security import TokenType, compare_password, decode_token, generate_access_token, generate_refresh_token, hash_password
from fastapi import HTTPException
from model.admin_user_model import AdminUserModel
from repository.admin_user_repository import AdminUserRepository
from repository.poi_owner_registration_repository import PoiOwnerRegistrationRepository
from repository.role_repository import RoleRepository
from schema.contract.authorize_contract import ChangePassword, LoginUser, RegisterUser


class AuthorizeService:
    def __init__(self, db: PostgresDB):
        self.users = AdminUserRepository(db)
        self.registrations = PoiOwnerRegistrationRepository(db)
        self.roles = RoleRepository(db)

    async def register_user(self, body: RegisterUser):
        email, phone = body.email.strip().lower(), body.phone.strip()
        if await self.users.find_by_email_or_phone(email, phone):
            raise HTTPException(400, "Email hoặc SĐT đã tồn tại")
        role = await self.roles.find_by_name("user", system_only=True)
        if role is None:
            raise HTTPException(503, "Vai trò người dùng chưa được cấu hình")
        user = await self.users.insert(AdminUserModel(full_name=body.full_name.strip(), email=email, phone=phone, password_hash=hash_password(body.password), is_active=True, is_poi_owner_verified=False, role_id=role.id))
        return {"user_id": str(user.id), "role_id": str(role.id)}

    async def _access_token(self, user):
        role = await self.roles.find_by_id(user.role_id) if user.role_id else None
        return generate_access_token(str(user.id), role.name if role else None, role.permissions if role else [], user.is_poi_owner_verified)

    async def login(self, body: LoginUser):
        user = await self.users.find_by_identifier(body.identifier.strip())
        if user is None or not compare_password(body.password, user.password_hash):
            raise HTTPException(401, "Thông tin đăng nhập không chính xác")
        if not user.is_active:
            raise HTTPException(401, "Tài khoản bị khóa")
        return {"access_token": await self._access_token(user), "refresh_token": generate_refresh_token(str(user.id))}

    async def get_current_profile(self, user_id: str):
        user = await self.users.find_by_id(parse_uuid(user_id, "Mã tài khoản"))
        if user is None:
            raise HTTPException(404, "Không tìm thấy tài khoản")
        role = await self.roles.find_by_id(user.role_id) if user.role_id else None
        registrations = await self.registrations.find_by_user(user.id)
        return {"admin_user": user, "poi_owner_registration": registrations[0] if registrations else None, "role": role}

    async def refresh_access_token(self, token: str | None):
        if token is None:
            raise HTTPException(401, "Không tìm thấy refresh token")
        try:
            payload = decode_token(token, TokenType.REFRESH)
        except (jwt.PyJWTError, ValueError) as error:
            raise HTTPException(401, "Refresh token không chính xác") from error
        user = await self.users.find_by_id(parse_uuid(payload["sub"], "Mã tài khoản"))
        if user is None or not user.is_active:
            raise HTTPException(401, "Tài khoản không tồn tại hoặc đã bị khóa")
        return await self._access_token(user)

    async def change_password(self, user_id: str, body: ChangePassword):
        user = await self.users.find_by_id(parse_uuid(user_id, "Mã tài khoản"))
        if user is None:
            raise HTTPException(404, "Tài khoản không tồn tại")
        if not compare_password(body.current_password, user.password_hash):
            raise HTTPException(400, "Mật khẩu hiện tại không chính xác")
        if body.current_password == body.new_password:
            raise HTTPException(400, "Mật khẩu mới phải khác mật khẩu hiện tại")
        user.password_hash = hash_password(body.new_password)
        await self.users.update(user)
