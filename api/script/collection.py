"""Create every PostgreSQL application table and model constraint.

Run from ``api`` after resetting a legacy database:
``.venv/bin/python script/collection.py``
"""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import close_postgres, engine
from model.base.base import Base


REQUIRED_TABLES = {
    "roles",
    "admin_users",
    "poi_categories",
    "pois",
    "poi_localizations",
    "menu_items",
    "menu_item_localizations",
    "poi_owner_registrations",
    "poi_submissions",
    "poi_tasks",
    "poi_task_events",
    "poi_task_processes",
    "ui_bundles",
    "content_dataset_versions",
    "ai_usage_limits",
    "analytics_events",
    "owner_notifications",
    "audit_logs",
    "tours",
    "tour_pois",
    "transaction_logs",
}


def validate_metadata() -> None:
    missing_models = REQUIRED_TABLES.difference(Base.metadata.tables)
    if missing_models:
        raise RuntimeError(f"Models are not registered: {sorted(missing_models)}")


async def create_tables() -> None:
    validate_metadata()
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    print(f"PostgreSQL tables and constraints are ready: {len(REQUIRED_TABLES)} tables")


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
