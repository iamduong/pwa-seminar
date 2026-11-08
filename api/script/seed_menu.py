"""Add or refresh the PostgreSQL menu fixtures without deleting existing data."""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "script"))

from core.provider.postgres import SessionFactory, close_postgres
from seed.menu_item import init_menu_items
from sqlalchemy import select
from model.admin_user_model import AdminUserModel
from model.poi_category_model import PoiCategoryModel


async def main() -> None:
    try:
        async with SessionFactory() as session:
            owner = (await session.scalars(select(AdminUserModel).where(AdminUserModel.email == "owner@dev.com"))).first()
            category = (await session.scalars(select(PoiCategoryModel).order_by(PoiCategoryModel.created_at))).first()
            if owner is None or category is None:
                raise RuntimeError("Hãy chạy script/collection.py trước")
            await init_menu_items(session, category, owner)
            await session.commit()
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(main())
