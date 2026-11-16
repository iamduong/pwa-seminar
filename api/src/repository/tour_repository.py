from datetime import UTC, datetime
from uuid import UUID

from core.dependency import PostgresDB
from model.poi_model import PoiModel
from model.tour_model import TourModel
from model.tour_poi_model import TourPoiModel
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload


class TourRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    @staticmethod
    def _with_pois():
        return selectinload(TourModel.poi_links).selectinload(TourPoiModel.poi)

    async def find_pagination(
        self,
        page: int,
        page_size: int,
        *,
        keyword: str | None,
        deleted: bool,
    ) -> tuple[list[TourModel], int]:
        conditions = [
            TourModel.deleted_at.is_not(None)
            if deleted
            else TourModel.deleted_at.is_(None)
        ]
        if keyword:
            pattern = f"%{keyword.strip()}%"
            conditions.append(TourModel.code.ilike(pattern))
        tours = (
            await self.context.scalars(
                select(TourModel)
                .options(self._with_pois())
                .where(*conditions)
                .order_by(TourModel.created_at.desc(), TourModel.id)
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).all()
        total = await self.context.scalar(
            select(func.count()).select_from(TourModel).where(*conditions)
        )
        return list(tours), total or 0

    async def find_by_id(
        self,
        tour_id: UUID,
        *,
        deleted: bool = False,
    ) -> TourModel | None:
        condition = (
            TourModel.deleted_at.is_not(None)
            if deleted
            else TourModel.deleted_at.is_(None)
        )
        return (
            await self.context.scalars(
                select(TourModel)
                .options(self._with_pois())
                .where(TourModel.id == tour_id, condition)
            )
        ).one_or_none()

    async def code_exists(self, code: str) -> bool:
        return bool(
            await self.context.scalar(
                select(func.count())
                .select_from(TourModel)
                .where(TourModel.code == code)
            )
        )

    async def list_available_pois(self) -> list[PoiModel]:
        return list(
            (
                await self.context.scalars(
                    select(PoiModel)
                    .where(PoiModel.deleted_at.is_(None))
                    .order_by(PoiModel.name, PoiModel.id)
                )
            ).all()
        )

    async def find_available_pois(self, poi_ids: list[UUID]) -> list[PoiModel]:
        return list(
            (
                await self.context.scalars(
                    select(PoiModel).where(
                        PoiModel.id.in_(poi_ids),
                        PoiModel.deleted_at.is_(None),
                    )
                )
            ).all()
        )

    async def insert(self, tour: TourModel, poi_ids: list[UUID]) -> TourModel:
        self.context.add(tour)
        await self.context.flush()
        self.context.add_all(
            [TourPoiModel(tour_id=tour.id, poi_id=poi_id) for poi_id in poi_ids]
        )
        await self.context.flush()
        return tour

    async def soft_delete(self, tour: TourModel) -> None:
        tour.deleted_at = datetime.now(UTC)
        await self.context.flush()

    async def restore(self, tour: TourModel) -> None:
        tour.deleted_at = None
        tour.updated_at = datetime.now(UTC)
        await self.context.flush()
