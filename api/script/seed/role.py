from core.permission import PERMISSIONS
from model.role_model import RoleModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


ROLE_FIXTURES = [
    ("super_admin", PERMISSIONS, 0),
    ("admin", ["poi:read", "poi:create", "poi:update", "poi:delete", "menu:read", "menu:create", "menu:review", "owner_registration:read", "owner_registration:review", "poi_submission:read", "poi_submission:review"], 1),
    ("poi_owner", ["owner:poi_read", "owner:poi_submit", "owner:menu_read", "owner:menu_submit"], 10),
    ("user", ["owner_registration:register", "owner_registration:read_self", "owner_registration:resubmit"], 100),
]


async def init_role(session: AsyncSession) -> dict[str, RoleModel]:
    roles: dict[str, RoleModel] = {}
    for name, permissions, priority in ROLE_FIXTURES:
        role = (await session.scalars(select(RoleModel).where(RoleModel.name == name))).first()
        if role is None:
            role = RoleModel(name=name, permissions=permissions, is_system=True, priority=priority)
            session.add(role)
        else:
            role.permissions, role.priority, role.is_system, role.deleted_at = permissions, priority, True, None
        roles[name] = role
    await session.flush()
    print(f"roles: {len(roles)} fixtures ready")
    return roles
