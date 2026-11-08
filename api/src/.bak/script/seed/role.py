from core.permission import PERMISSIONS
from model.role_model import RoleModel
from pymongo.asynchronous.database import AsyncDatabase

super_admin_domain = PERMISSIONS
admin_domain = [
    "poi:read",
    "menu:read",
    "menu:create",
    "menu:review",
]
poi_owner_domain = [
    "owner:poi_read",
    "owner:poi_submit",
    "owner:menu_read",
    "owner:menu_submit",
]
user_domain = [
    "owner_registration:register",
    "owner_registration:read_self",
    "owner_registration:resubmit",
]


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
