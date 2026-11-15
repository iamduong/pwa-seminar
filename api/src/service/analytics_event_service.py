from uuid import UUID

from core.dependency import PostgresDB
from model.analytics_event_model import AnalyticsEventModel
from repository.analytics_event_repository import AnalyticsEventRepository
from repository.poi_repository import PoiRepository
from core.identifier import parse_uuid
from fastapi import HTTPException
from schema.analytics_event_schema import ViewAudioPlayCount


class AnalyticsEventService:
    def __init__(self, db: PostgresDB):
        self.repository = AnalyticsEventRepository(db)
        self.pois = PoiRepository(db)

    async def connect_visitor(self, session_id: UUID) -> AnalyticsEventModel:
        return await self.repository.create_visitor_connection(session_id)

    async def record_audio_play(self, poi_id: str) -> ViewAudioPlayCount:
        parsed_poi_id = parse_uuid(poi_id, "Mã POI")
        poi = await self.pois.find_by_id(parsed_poi_id, active=True)
        if poi is None:
            raise HTTPException(404, "Không tìm thấy POI đang hoạt động")
        count = await self.repository.increment_audio_play(parsed_poi_id)
        return ViewAudioPlayCount(
            poi_id=str(parsed_poi_id),
            audio_listen_count=count,
        )

    async def disconnect_visitor(self, event_id: UUID) -> None:
        await self.repository.disconnect_visitor(event_id)

    async def disconnect_all_visitors(self) -> None:
        await self.repository.disconnect_all_visitors()

    async def get_presence_counts(self) -> tuple[int, int]:
        return await self.repository.get_presence_counts()
