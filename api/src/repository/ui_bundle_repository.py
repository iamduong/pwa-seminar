from core.dependency import PostgresDB
from model.ui_bundle_model import UiBundleModel
from sqlalchemy import select


class UiBundleRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def find_by_lang(self, lang: str) -> UiBundleModel | None:
        return (
            await self.context.scalars(
                select(UiBundleModel).where(
                    UiBundleModel.lang == lang,
                    UiBundleModel.deleted_at.is_(None),
                )
            )
        ).one_or_none()
