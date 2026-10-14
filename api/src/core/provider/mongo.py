from core.setting import get_setting
from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

setting = get_setting()

mongo_client: AsyncMongoClient | None = None
mongo_database: AsyncDatabase | None = None


async def connect_mongo() -> None:
    global mongo_client, mongo_database

    mongo_client = AsyncMongoClient(setting.MONGO_ENDPOINT)
    mongo_database = mongo_client[setting.MONGO_DATABASE]

    await mongo_client.admin.command("ping")


async def close_mongo() -> None:
    if mongo_client is not None:
        await mongo_client.close()


def get_mongo() -> AsyncDatabase:
    if mongo_database is None:
        raise RuntimeError("MongoDB is not initilized")
    return mongo_database
