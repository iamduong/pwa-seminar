import asyncio

import core.provider.mongo as client
from core.setting import get_setting
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

    await db["poi_submission"].create_index([("owner_id", 1), ("status", 1)])
    await db["poi_submission"].create_index([("created_at", -1)])
    await db["poi"].create_index([("location", "2dsphere")])

    print("Init collection successfully")

    # Insert seeds
    await init_role(db)
    await init_admin_user(db)
    await init_poi_category(db)


asyncio.run(init_collection())
