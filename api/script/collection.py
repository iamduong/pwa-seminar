"""Create PostgreSQL tables and insert idempotent development fixtures.

Run from ``api``: ``.venv/bin/python script/collection.py``
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "script"))

import model  # noqa: F401 - register every SQLAlchemy mapper
from core.provider.postgres import SessionFactory, close_postgres, engine
from model.base.base import Base
from model.content_dataset_version_model import ContentDatasetVersionModel
from model.poi_owner_registration_model import PoiOwnerRegistrationModel
from seed.admin_user import init_admin_user
from seed.menu_item import init_menu_items
from seed.poi_category import init_poi_category
from seed.role import init_role
from seed.ui_bundle import init_ui_bundles
from sqlalchemy import select


async def create_tables() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    print("PostgreSQL tables are ready")


async def seed_data() -> None:
    async with SessionFactory() as session:
        roles = await init_role(session)
        users = await init_admin_user(session, roles)
        categories = await init_poi_category(session)
        owner = users["owner@dev.com"]
        await init_menu_items(session, categories[0], owner)
        await init_ui_bundles(session)

        registration = (
            await session.scalars(
                select(PoiOwnerRegistrationModel).where(
                    PoiOwnerRegistrationModel.user_id == owner.id
                )
            )
        ).first()
        if registration is None:
            session.add(
                PoiOwnerRegistrationModel(
                    user_id=owner.id,
                    business_name="Ẩm thực Sài Gòn Demo",
                    business_address="Quận 1, TP.HCM",
                    note="Dữ liệu mẫu",
                    admin_note="Đã duyệt bởi script seed",
                    status="approved",
                )
            )

        version = (
            await session.scalars(
                select(ContentDatasetVersionModel).where(
                    ContentDatasetVersionModel.key_query == "poi"
                )
            )
        ).first()
        if version is None:
            session.add(ContentDatasetVersionModel(key_query="poi", etag=uuid4().hex))
        await session.commit()
    print("Sample data seeded successfully")


async def main() -> None:
    try:
        await create_tables()
        await seed_data()
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(main())
