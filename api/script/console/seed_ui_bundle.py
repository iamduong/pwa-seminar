"""Add or refresh UI bundles without deleting other PostgreSQL data.

Run from ``api``: ``.venv/bin/python script/console/seed_ui_bundle.py``
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "script"))

from core.provider.postgres import SessionFactory, close_postgres
from seed.ui_bundle import init_ui_bundles


async def main() -> None:
    try:
        async with SessionFactory() as session:
            await init_ui_bundles(session)
            await session.commit()
        print("UI bundles seeded successfully")
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(main())
