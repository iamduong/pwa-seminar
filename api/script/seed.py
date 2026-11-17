"""Insert or refresh all idempotent development fixtures.

Create the schema first with ``.venv/bin/python script/collection.py``, then run
from ``api``: ``.venv/bin/python script/seed.py``.
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "script"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import SessionFactory, close_postgres, engine
from model.base.base import Base
from seed.admin_user import init_admin_users
from seed.ai_usage_limit import init_ai_usage_limits
from seed.category import init_categories
from seed.permission import init_permissions
from seed.role import init_roles
from seed.ui_bundle import sync_ui_bundles
from sqlalchemy import inspect


async def ensure_schema_exists() -> None:
    async with engine.connect() as connection:
        table_names = set(
            await connection.run_sync(lambda sync: inspect(sync).get_table_names())
        )
    missing_tables = set(Base.metadata.tables).difference(table_names)
    if missing_tables:
        raise RuntimeError(
            "Database schema is incomplete. Run script/collection.py first. "
            f"Missing tables: {sorted(missing_tables)}"
        )


async def seed_data() -> None:
    await ensure_schema_exists()
    async with SessionFactory() as session:
        permissions = init_permissions()
        roles = await init_roles(session, permissions)
        users = await init_admin_users(session, roles)
        await init_categories(session)
        await sync_ui_bundles(session)
        await init_ai_usage_limits(session, users)
        await session.commit()

    print("All required development data was seeded successfully")


async def main() -> None:
    try:
        await seed_data()
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
