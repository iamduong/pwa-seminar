"""Add the visitor presence fields required by the analytics service."""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from core.provider.postgres import close_postgres, engine


async def migrate() -> None:
    async with engine.begin() as connection:
        await connection.execute(text(
            "ALTER TABLE analytics_events "
            "ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ"
        ))
        await connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_analytics_event_presence "
            "ON analytics_events (event_type, disconnected_at)"
        ))
        migrated = await connection.scalar(text(
            "SELECT EXISTS ("
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'analytics_events' "
            "AND column_name = 'disconnected_at'"
            ")"
        ))
        if not migrated:
            raise RuntimeError("Không thể thêm analytics_events.disconnected_at")

    print("analytics_events.disconnected_at is ready")


async def main() -> None:
    try:
        await migrate()
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
