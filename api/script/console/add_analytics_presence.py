"""Add visitor connection tracking fields to an existing database.

Run once from ``api``:
``.venv/Scripts/python script/console/add_analytics_presence.py``.
Fresh databases created from the SQLAlchemy models already include these fields.
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))

from core.provider.postgres import close_postgres, engine


async def main() -> None:
    try:
        async with engine.begin() as connection:
            await connection.execute(
                text(
                    "ALTER TABLE analytics_events "
                    "ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ NULL"
                )
            )
            await connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_analytics_event_presence "
                    "ON analytics_events (event_type, disconnected_at)"
                )
            )
        print("analytics presence fields are ready")
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
