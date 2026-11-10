"""Change application foreign keys to block deletion of referenced parents.

Run once for an existing database from ``api``:
``.venv/bin/python script/console/enforce_restrict_foreign_keys.py``.
Fresh databases created from the SQLAlchemy models already use this rule.
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from core.provider.postgres import close_postgres, engine

FOREIGN_KEYS = [
    ("admin_users", "role_id", "roles"),
    ("pois", "owner_id", "admin_users"),
    ("pois", "category_id", "poi_categories"),
    ("menu_items", "poi_id", "pois"),
    ("poi_localizations", "poi_id", "pois"),
    ("poi_owner_registrations", "user_id", "admin_users"),
    ("poi_submissions", "owner_id", "admin_users"),
    ("poi_submissions", "poi_id", "pois"),
    ("poi_submissions", "category_id", "poi_categories"),
    ("poi_tasks", "poi_id", "pois"),
    ("poi_task_events", "task_id", "poi_tasks"),
    ("poi_task_processes", "task_id", "poi_tasks"),
    ("ai_usage_limits", "user_id", "admin_users"),
    ("analytics_events", "user_id", "admin_users"),
    ("analytics_events", "poi_id", "pois"),
    ("analytics_events", "menu_item_id", "menu_items"),
    ("menu_item_localizations", "menu_item_id", "menu_items"),
]


async def main() -> None:
    try:
        async with engine.begin() as connection:
            for table, column, parent_table in FOREIGN_KEYS:
                constraint = f"{table}_{column}_fkey"
                await connection.execute(
                    text(
                        f'ALTER TABLE "{table}" '
                        f'DROP CONSTRAINT IF EXISTS "{constraint}"'
                    )
                )
                await connection.execute(
                    text(
                        f'ALTER TABLE "{table}" '
                        f'ADD CONSTRAINT "{constraint}" '
                        f'FOREIGN KEY ("{column}") REFERENCES "{parent_table}"(id) '
                        "ON DELETE RESTRICT"
                    )
                )
        print(f"foreign keys: {len(FOREIGN_KEYS)} constraints now use ON DELETE RESTRICT")
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
