"""Drop every application table and all data from PostgreSQL.

Run from ``api``: ``.venv/bin/python script/reset.py --yes``.
This command intentionally does not recreate or seed the database.
"""

import argparse
import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import close_postgres, engine
from model.base.base import Base

REQUIRED_TABLES = {"owner_notifications", "audit_logs"}


async def reset_database() -> None:
    missing_models = REQUIRED_TABLES.difference(Base.metadata.tables)
    if missing_models:
        raise RuntimeError(f"Models are not registered: {sorted(missing_models)}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    print("All PostgreSQL application tables and data were removed")


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Drop all application tables and data.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Confirm the destructive operation.",
    )
    arguments = parser.parse_args()
    if not arguments.yes:
        parser.error("Refusing to reset without --yes")

    try:
        await reset_database()
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
