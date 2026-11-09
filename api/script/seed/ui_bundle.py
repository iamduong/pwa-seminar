from core.ui_bundle import UI_BUNDLE_FIXTURES
from model.ui_bundle_model import UiBundleModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def init_ui_bundles(session: AsyncSession) -> list[UiBundleModel]:
    existing = {
        item.lang: item
        for item in (
            await session.scalars(select(UiBundleModel))
        ).all()
    }
    result: list[UiBundleModel] = []

    for lang, fixture in UI_BUNDLE_FIXTURES.items():
        model = existing.get(lang)
        if model is None:
            model = UiBundleModel(
                lang=lang,
                ui_bundle=fixture.value,
                version=fixture.version,
            )
            session.add(model)
        else:
            model.ui_bundle = fixture.value
            model.version = fixture.version
            model.deleted_at = None

        result.append(model)

    await session.flush()
    return result
