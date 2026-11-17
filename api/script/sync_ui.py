"""Synchronize UI bundles in an existing database.

Run from ``api`` with ``.venv/bin/python script/sync_ui.py``.
Unlike ``seed.py``, this script only inserts or updates UI bundle records and
does not touch users, roles, permissions, categories, or usage limits.
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "script"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import SessionFactory, close_postgres
from seed.ui_bundle import sync_ui_bundles


async def sync_ui() -> None:
    async with SessionFactory() as session:
        bundles = await sync_ui_bundles(session)
        await session.commit()

    languages = ", ".join(bundle.lang for bundle in bundles)
    print(f"UI bundles synchronized successfully: {languages}")


async def main() -> None:
    try:
        await sync_ui()
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
