import asyncio

import core.provider.mongo as client
from core.setting import get_setting
from seed.admin_user import init_admin_user

setting = get_setting()


async def init_collection():
    await client.connect_mongo()
    if client.mongo_client is None:
        raise RuntimeError("MongoDB is not loaded")

    # Create collection
    db = client.get_mongo()
    # await db.create_collection("role")
    # await db.create_collection("admin_user")
    # await db.create_collection("poi_owner_registration")

    # print("Init collection successfully")

    # Insert seeds
    # await init_role(db)
    await init_admin_user(db)


asyncio.run(init_collection())
