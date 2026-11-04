import asyncio
from datetime import UTC, datetime

import core.provider.mongo as client
from core.setting import get_setting
from model.admin_user_model import AdminUserModel
from model.role_model import RoleModel
from pydantic import ValidationError
from seed.admin_user import init_admin_user
from seed.poi_category import init_poi_category
from seed.role import init_role

setting = get_setting()


async def init_collection():
    await client.connect_mongo()
    if client.mongo_client is None:
        raise RuntimeError("MongoDB is not loaded")

    # Create collection
    db = client.get_mongo()

    await db.create_collection("role")
    await db.create_collection("admin_user")

    await db.create_collection("poi_owner_registration")
    await db.create_collection("poi_category")
    await db.create_collection("poi_submission")
    await db.create_collection("poi")
    await db.create_collection("poi_task")
    await db.create_collection("poi_localization")

    print("Init collection successfully")

    # Insert seeds
    await init_role(db)
    await init_admin_user(db)
    await init_poi_category(db)

    # Insert defaul admin_user for testing
    role_collection = db["role"]
    admin_user_collection = db["admin_user"]

    try:
        role_document = await role_collection.find_one({"name": "super_admin"})
        if role_document is None:
            raise ValueError("Failed")

        role_model = RoleModel.model_validate(role_document)

        await admin_user_collection.insert_one(
            AdminUserModel(
                full_name="Nguyễn Admin",
                email="admin@dev.com",
                phone="03888583835",
                password_hash="$2b$12$cN1cQ.LSTm8x6c8ve1.n8exx25jrdgOqykCrrzFhqJNyFSalEygRK",
                is_active=True,
                is_poi_owner_verified=True,
                id_card_encrypted="",
                pii_collected_at=datetime.now(UTC),
                role_id=role_model.id,
            ).to_dump()
        )

        print("Insert default admin is successful")

    except ValueError, ValidationError:
        print("Insert default admin user is failed")


asyncio.run(init_collection())
