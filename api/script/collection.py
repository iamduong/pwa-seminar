"""Create all PostgreSQL tables without inserting fixture data.

Run from ``api``: ``.venv/bin/python script/collection.py``
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import close_postgres, engine
from model.base.base import Base
from sqlalchemy import text

REQUIRED_TABLES = {"owner_notifications", "audit_logs", "ai_usage_limits"}


async def create_tables() -> None:
    missing_models = REQUIRED_TABLES.difference(Base.metadata.tables)
    if missing_models:
        raise RuntimeError(f"Models are not registered: {sorted(missing_models)}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        # create_all does not add columns to an existing database.
        await connection.execute(text(
            "ALTER TABLE ai_usage_limits ADD COLUMN IF NOT EXISTS "
            "daily_limit INTEGER NOT NULL DEFAULT 20 CHECK (daily_limit >= 0)"
        ))
    print("PostgreSQL tables are ready")


async def main() -> None:
    try:
        await create_tables()
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
