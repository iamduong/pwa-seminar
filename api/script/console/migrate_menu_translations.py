"""Run once before deploying menu translation workers; removes stored prices."""

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT))

import model  # noqa: F401 - register mapped relationships
from core.provider.postgres import close_postgres, engine
from model.menu_item_localization_model import MenuItemLocalizationModel
from resource.config import MY_MEMORY_LANGUAGES
from sqlalchemy import text


async def migrate():
    async with engine.begin() as connection:
        await connection.run_sync(lambda sync: MenuItemLocalizationModel.__table__.create(sync, checkfirst=True))
        await connection.execute(text("ALTER TABLE menu_items DROP COLUMN IF EXISTS price"))
        await connection.execute(text("ALTER TABLE menu_items ALTER COLUMN is_available SET DEFAULT false"))
        await connection.execute(text("""
            DELETE FROM menu_item_localizations AS localization
            USING menu_items AS item
            WHERE localization.menu_item_id = item.id
              AND (NOT item.is_active OR item.deleted_at IS NOT NULL)
        """))
        await connection.execute(text("DELETE FROM menu_item_localizations WHERE NOT (lang = ANY(:languages))"), {"languages": MY_MEMORY_LANGUAGES})
        for language in MY_MEMORY_LANGUAGES:
            await connection.execute(text("""
                INSERT INTO menu_item_localizations
                    (id, menu_item_id, lang, name, description, translation_status)
                SELECT gen_random_uuid(), id, :lang, name, description, 'pending'
                FROM menu_items WHERE is_active AND deleted_at IS NULL
                ON CONFLICT (menu_item_id, lang) DO UPDATE
                SET name = EXCLUDED.name, description = EXCLUDED.description,
                    translation_status = 'pending', error_message = NULL,
                    deleted_at = NULL, updated_at = now()
                WHERE menu_item_localizations.deleted_at IS NOT NULL
            """), {"lang": language})
        await connection.execute(text("""
            UPDATE menu_items AS item
            SET is_available = (
                item.is_active AND item.deleted_at IS NULL AND
                (SELECT count(DISTINCT lang) FROM menu_item_localizations
                 WHERE menu_item_id = item.id AND deleted_at IS NULL
                   AND lang = ANY(:languages) AND translation_status = 'ready') = :total
            )
        """), {"languages": MY_MEMORY_LANGUAGES, "total": len(MY_MEMORY_LANGUAGES)})
        incomplete_queues = await connection.scalar(text("""
            SELECT count(*) FROM menu_items AS item
            WHERE item.is_active AND item.deleted_at IS NULL AND
                (SELECT count(DISTINCT lang) FROM menu_item_localizations
                 WHERE menu_item_id = item.id AND deleted_at IS NULL
                   AND lang = ANY(:languages)) <> :total
        """), {"languages": MY_MEMORY_LANGUAGES, "total": len(MY_MEMORY_LANGUAGES)})
        assert incomplete_queues == 0, "Approved menu items are missing translation jobs"


async def main():
    try:
        await migrate()
        print("Menu translation schema and queues are ready")
    finally:
        await close_postgres()


if __name__ == "__main__":
    asyncio.run(main(), loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None)
