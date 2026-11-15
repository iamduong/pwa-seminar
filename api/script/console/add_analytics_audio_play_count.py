"""Add the aggregate audio-play counter to analytics events.

Run once from ``api``:
``.venv/Scripts/python script/console/add_analytics_audio_play_count.py``.
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
                    "ALTER COLUMN session_id DROP NOT NULL"
                )
            )
            await connection.execute(
                text(
                    "ALTER TABLE analytics_events "
                    "ADD COLUMN IF NOT EXISTS audio_listen_count "
                    "INTEGER NOT NULL DEFAULT 0"
                )
            )
            await connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS "
                    "uq_analytics_audio_play_poi "
                    "ON analytics_events (poi_id) "
                    "WHERE event_type = 'audio_play' AND deleted_at IS NULL"
                )
            )
        print("Analytics audio-play counter is ready")
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None,
    )
