from core.dependency import PostgresDB
from core.ui_bundle import UiBundle
from repository.ui_bundle_repository import UiBundleRepository


class UiBundleService:
    def __init__(self, db: PostgresDB):
        self.repository = UiBundleRepository(db)

    async def find_by_lang(self, lang: str) -> UiBundle | None:
        model = await self.repository.find_by_lang(lang)
        if model is None:
            return None

        return UiBundle(
            lang=model.lang,
            version=model.version,
            etag=str(model.version),
            value=model.ui_bundle,
        )
