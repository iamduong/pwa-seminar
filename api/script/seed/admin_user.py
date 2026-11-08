from datetime import UTC, datetime

import bcrypt
from model.admin_user_model import AdminUserModel
from model.role_model import RoleModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

PASSWORD = "Admin@123"
USER_FIXTURES = [
    ("Nguyễn Admin", "admin@dev.com", "0388858383", "super_admin", True),
    ("Nguyễn Chủ Quán", "owner@dev.com", "0388858384", "poi_owner", True),
    ("Lâm Vinh Đạt", "lamvinhdat@gmail.com", "0969297300", "user", False),
    ("Trần Thanh Quy", "thanhquyfu@gmail.com", "0969297301", "user", False),
    ("Nguyễn Minh Anh", "nguyenminhanh@gmail.com", "0969297302", "user", False),
    ("Lê Hoàng Nam", "lehoangnam@gmail.com", "0969297303", "user", False),
    ("Phạm Thu Hà", "phamthuha@gmail.com", "0969297304", "user", False),
]


async def init_admin_user(session: AsyncSession, roles: dict[str, RoleModel]) -> dict[str, AdminUserModel]:
    users = {}
    password_hash = bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt()).decode()
    for full_name, email, phone, role_name, verified in USER_FIXTURES:
        user = (await session.scalars(select(AdminUserModel).where(AdminUserModel.email == email))).first()
        if user is None:
            user = AdminUserModel(
                full_name=full_name, email=email, phone=phone, password_hash=password_hash,
                is_active=True, is_poi_owner_verified=verified, role_id=roles[role_name].id,
                pii_collected_at=datetime.now(UTC) if verified else None,
            )
            session.add(user)
        else:
            user.role_id, user.is_active, user.deleted_at = roles[role_name].id, True, None
        users[email] = user
    await session.flush()
    print(f"admin_users: {len(users)} fixtures ready (password: {PASSWORD})")
    return users
