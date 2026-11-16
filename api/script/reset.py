"""Drop every PostgreSQL application table, relation and row.

Run from ``api``: ``.venv/bin/python script/reset.py --yes``.
This command does not recreate or seed the database.
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


async def reset_database() -> None:
    if not Base.metadata.tables:
        raise RuntimeError("No application models are registered")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
    print("All PostgreSQL application tables, relations and data were removed")


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Drop all application tables, relations and data.",
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
