"""Add or refresh UI bundles without deleting other PostgreSQL data.

Run from ``api``: ``.venv/bin/python script/seed_ui_bundle.py``
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "script"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import SessionFactory, close_postgres, engine
from model.base.base import Base
from seed.ui_bundle import init_ui_bundles


async def main() -> None:
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with SessionFactory() as session:
            await init_ui_bundles(session)
            await session.commit()
        print("UI bundles seeded successfully")
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(main())
