"""Run from api: .venv/Scripts/python.exe script/seed_menu.py"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from core.provider.mongo import close_mongo, connect_mongo, get_mongo
from seed.menu_item import init_menu_items


async def main() -> None:
    try:
        await connect_mongo()
        db = get_mongo()
        print(f"Seeding admin menu fixtures into {db.name}")
        await init_menu_items(db)
    finally:
        await close_mongo()


if __name__ == "__main__":
    asyncio.run(main())
