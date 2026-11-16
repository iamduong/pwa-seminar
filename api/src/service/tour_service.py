from datetime import UTC, datetime
from uuid import UUID

from core.dependency import PostgresDB
from core.identifier import parse_uuid
from core.pagination import Pagination
from fastapi import HTTPException
from model.tour_model import TourModel, generate_tour_code
from repository.audit_log_repository import AuditLogRepository
from repository.tour_repository import TourRepository
from schema.tour_schema import CreateTour, FilterTour, ViewTour, ViewTourPoi


class TourService:
    def __init__(self, db: PostgresDB):
        self.db = db
        self.repository = TourRepository(db)
        self.audit_logs = AuditLogRepository(db)

    @staticmethod
    def _view(tour: TourModel) -> ViewTour:
        return ViewTour(
            id=str(tour.id),
            code=tour.code,
            price=tour.price,
            max_people=tour.max_people,
            scanned_people=tour.scanned_people,
            expires_at=tour.expires_at,
            pois=[
                ViewTourPoi(
                    id=str(link.poi.id),
                    name=link.poi.name,
                    address=link.poi.address,
                )
                for link in tour.poi_links
                if link.deleted_at is None and link.poi.deleted_at is None
            ],
            created_at=tour.created_at,
            updated_at=tour.updated_at,
            deleted_at=tour.deleted_at,
        )

    async def filter_tours(self, filters: FilterTour) -> Pagination[ViewTour]:
        tours, total = await self.repository.find_pagination(
            filters.page,
            filters.page_size,
            keyword=filters.q,
            deleted=filters.is_deleted,
        )
        return Pagination[ViewTour](
            page=filters.page,
            page_size=filters.page_size,
            total_item=total,
            total_page=(total + filters.page_size - 1) // filters.page_size,
            data=[self._view(tour) for tour in tours],
        )

    async def list_poi_options(self) -> list[ViewTourPoi]:
        return [
            ViewTourPoi(id=str(poi.id), name=poi.name, address=poi.address)
            for poi in await self.repository.list_available_pois()
        ]

    async def create_tour(
        self,
        body: CreateTour,
        actor_user_id: UUID,
    ) -> ViewTour:
        expires_at = body.expires_at
        if expires_at.tzinfo is None:
            raise HTTPException(422, "Ngày hết hạn phải bao gồm múi giờ")
        if expires_at <= datetime.now(UTC):
            raise HTTPException(422, "Ngày hết hạn phải ở tương lai")

        poi_ids = [parse_uuid(value, "Mã POI") for value in body.poi_ids]
        pois = await self.repository.find_available_pois(poi_ids)
        found_ids = {poi.id for poi in pois}
        missing_ids = [str(value) for value in poi_ids if value not in found_ids]
        if missing_ids:
            raise HTTPException(
                422,
                "POI không tồn tại: " + ", ".join(missing_ids),
            )

        code = ""
        for _ in range(10):
            candidate = generate_tour_code()
            if not await self.repository.code_exists(candidate):
                code = candidate
                break
        if not code:
            raise HTTPException(503, "Không thể sinh mã tour duy nhất. Vui lòng thử lại")

        tour = TourModel(
            code=code,
            price=body.price,
            max_people=body.max_people,
            scanned_people=0,
            expires_at=expires_at,
        )
        await self.repository.insert(tour, poi_ids)
        await self.audit_logs.create(
            actor_user_id=actor_user_id,
            action="tour.create",
            resource_type="tour",
            resource_id=tour.id,
            description=f"Tạo tour {tour.code}",
            metadata={"poi_ids": [str(value) for value in poi_ids]},
        )
        saved = await self.repository.find_by_id(tour.id)
        if saved is None:
            raise HTTPException(500, "Không thể tải lại tour vừa tạo")
        return self._view(saved)

    async def delete_tour(self, tour_id: str, actor_user_id: UUID) -> None:
        tour = await self._get(tour_id)
        await self.repository.soft_delete(tour)
        await self.audit_logs.create(
            actor_user_id=actor_user_id,
            action="tour.delete",
            resource_type="tour",
            resource_id=tour.id,
            description=f"Xóa mềm tour {tour.code}",
        )

    async def restore_tour(
        self,
        tour_id: str,
        actor_user_id: UUID,
    ) -> ViewTour:
        tour = await self._get(tour_id, deleted=True)
        await self.repository.restore(tour)
        await self.audit_logs.create(
            actor_user_id=actor_user_id,
            action="tour.restore",
            resource_type="tour",
            resource_id=tour.id,
            description=f"Khôi phục tour {tour.code}",
        )
        restored = await self.repository.find_by_id(tour.id)
        if restored is None:
            raise HTTPException(500, "Không thể tải lại tour vừa khôi phục")
        return self._view(restored)

    async def _get(self, tour_id: str, *, deleted: bool = False) -> TourModel:
        tour = await self.repository.find_by_id(
            parse_uuid(tour_id, "Mã tour"),
            deleted=deleted,
        )
        if tour is None:
            raise HTTPException(
                404,
                "Không tìm thấy tour đã xóa" if deleted else "Không tìm thấy tour",
            )
        return tour
