from pymongo.asynchronous.database import AsyncDatabase

from core.permission import PERMISSIONS
from model.role_model import RoleModel

super_admin_domain = PERMISSIONS
admin_domain = [
    "poi:read",
    "poi:create",
    "poi:update",
    "poi:delete",
    "poi:approve",
    "poi:toogle",
    "menu:read",
    "menu:create",
    "menu:update",
    "menu:delete",
    "user:read",
    "user:create",
    "user:update",
    "user:delete",
    "analytics:view",
    "analytics:export",
    "analytics:view_own",
    "audit:read",
    "audit:manage",
    "content:moderate",
    "content:publish",
]
poi_owner_domain = [
    "poi:read",
    "owner:access",
    "owner:submit_poi",
    "owner:manage_own_poi",
    "menu:read",
    "menu:create",
    "menu:update",
    "analytics:view_own",
]
user_domain = ["poi:read", "menu:read", "owner:register"]


async def init_role(db: AsyncDatabase):
    collection = db["role"]

    roles: list[RoleModel] = [
        RoleModel(
            name="super_admin",
            permissions=super_admin_domain,
            is_system=True,
            priority=0,
        ),
        RoleModel(name="admin", permissions=admin_domain, is_system=True, priority=1),
        RoleModel(
            name="poi_owner", permissions=poi_owner_domain, is_system=True, priority=10
        ),
        RoleModel(name="user", permissions=user_domain, is_system=True, priority=100),
    ]

    documents = [role.model_dump(by_alias=True) for role in roles]
    result = await collection.insert_many(documents=documents)

    print(result.inserted_ids)
