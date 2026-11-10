"""Insert or refresh idempotent development fixtures.

Create the tables first with ``.venv/bin/python script/collection.py``.
Run from ``api``: ``.venv/bin/python script/seed.py``.
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "script"))

from core.provider.postgres import SessionFactory, close_postgres
from seed.admin_user import init_admin_users
from seed.category import init_categories
from seed.permission import init_permissions
from seed.role import init_roles
from seed.ui_bundle import init_ui_bundles


async def seed_data() -> None:
    async with SessionFactory() as session:
        permissions = init_permissions()
        roles = await init_roles(session, permissions)
        await init_admin_users(session, roles)
        await init_categories(session)
        await init_ui_bundles(session)
        await session.commit()

    print("Required development data seeded successfully")


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
