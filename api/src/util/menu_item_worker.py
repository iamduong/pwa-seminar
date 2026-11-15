import asyncio
import logging
from datetime import UTC, datetime, timedelta

from model.menu_item_localization_model import MenuItemLocalizationModel
from model.menu_item_model import MenuItemModel
from repository.menu_item_repository import MenuItemRepository
from resource.config import MY_MEMORY_LANGUAGES
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from util.translator import SOURCE_LANGUAGE, TranslationError, translate

TRANSLATION_TIMEOUT_SECONDS = 60
CLAIM_TIMEOUT_SECONDS = 120
POLL_INTERVAL_SECONDS = 2
logger = logging.getLogger(__name__)


async def _claim_translation(session_factory):
    async with session_factory() as session:
        row = (await session.execute(
            select(MenuItemLocalizationModel, MenuItemModel)
            .join(MenuItemModel, MenuItemModel.id == MenuItemLocalizationModel.menu_item_id)
            .where(
                MenuItemModel.deleted_at.is_(None), MenuItemModel.is_active.is_(True),
                MenuItemLocalizationModel.deleted_at.is_(None),
                MenuItemLocalizationModel.lang.in_(MY_MEMORY_LANGUAGES),
                or_(
                    MenuItemLocalizationModel.translation_status == "pending",
                    (MenuItemLocalizationModel.translation_status == "processing")
                    & (MenuItemLocalizationModel.updated_at < datetime.now(UTC) - timedelta(seconds=CLAIM_TIMEOUT_SECONDS)),
                ),
            )
            .order_by(MenuItemLocalizationModel.created_at, MenuItemLocalizationModel.id)
            .with_for_update(of=MenuItemLocalizationModel, skip_locked=True).limit(1)
        )).first()
        if row is None:
            return None
        localization, item = row
        localization.translation_status = "processing"
        localization.error_message = None
        localization.updated_at = datetime.now(UTC)
        await session.commit()
        return localization, item


async def _translate_item(item: MenuItemModel, language: str):
    if language == SOURCE_LANGUAGE:
        return item.name, item.description
    name = await translate(item.name, SOURCE_LANGUAGE, language)
    if len(name) > 200:
        raise TranslationError("Tên món ăn sau khi dịch vượt quá 200 ký tự")
    description = await translate(item.description, SOURCE_LANGUAGE, language) if item.description else item.description
    return name, description


async def _finish_translation(session, localization, name, description, error_message):
    repository = MenuItemRepository(session)
    item = await repository.find_by_id(localization.menu_item_id, for_update=True)
    if item is None or not item.is_active:
        return
    # A deleted localization ID or a newer claim must never accept an old result.
    result = await session.execute(
        update(MenuItemLocalizationModel).where(
            MenuItemLocalizationModel.id == localization.id,
            MenuItemLocalizationModel.deleted_at.is_(None),
            MenuItemLocalizationModel.translation_status == "processing",
            MenuItemLocalizationModel.updated_at == localization.updated_at,
        ).values(
            name=name, description=description,
            translation_status="failed" if error_message else "ready",
            error_message=error_message,
        )
    )
    if result.rowcount == 0:
        return
    current = await repository.find_localizations(item.id)
    item.is_available = (
        {row.lang for row in current} == set(MY_MEMORY_LANGUAGES)
        and all(row.translation_status == "ready" for row in current)
    )
    await repository.save(item)


async def process_menu_item_worker(
    session_factory: async_sessionmaker[AsyncSession], stop_event: asyncio.Event
) -> None:
    while not stop_event.is_set():
        try:
            claimed = await _claim_translation(session_factory)
            if claimed is not None:
                localization, item = claimed
                name, description, error_message = item.name, item.description, None
                try:
                    name, description = await asyncio.wait_for(
                        _translate_item(item, localization.lang), timeout=TRANSLATION_TIMEOUT_SECONDS
                    )
                except TimeoutError:
                    error_message = "Dịch vụ dịch không phản hồi trong 60 giây"
                except Exception:
                    logger.exception("Menu translation failed: item=%s language=%s", item.id, localization.lang)
                    error_message = "Không thể dịch nội dung. Vui lòng thử lại."
                async with session_factory() as session:
                    await _finish_translation(session, localization, name, description, error_message)
                continue
        except Exception:
            logger.exception("Menu translation worker failed")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=POLL_INTERVAL_SECONDS)
        except TimeoutError:
            pass
