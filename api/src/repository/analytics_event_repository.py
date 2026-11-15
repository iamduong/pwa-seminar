from uuid import UUID

from core.dependency import PostgresDB
from model.analytics_event_model import AnalyticsEventModel, AnalyticsEventType
from sqlalchemy import distinct, func, select, text, update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert


class AnalyticsEventRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    async def create_visitor_connection(
        self,
        session_id: UUID,
    ) -> AnalyticsEventModel:
        event = AnalyticsEventModel(
            event_type=AnalyticsEventType.VISITOR_CONNECTION.value,
            session_id=session_id,
        )
        self.context.add(event)
        await self.context.commit()
        await self.context.refresh(event)
        return event

    async def increment_audio_play(self, poi_id: UUID) -> int:
        statement = (
            postgresql_insert(AnalyticsEventModel)
            .values(
                event_type=AnalyticsEventType.AUDIO_PLAY.value,
                session_id=None,
                poi_id=poi_id,
                audio_listen_count=1,
            )
            .on_conflict_do_update(
                index_elements=[AnalyticsEventModel.poi_id],
                index_where=text(
                    "event_type = 'audio_play' AND deleted_at IS NULL"
                ),
                set_={
                    "audio_listen_count": AnalyticsEventModel.audio_listen_count + 1,
                    "updated_at": func.now(),
                },
            )
            .returning(AnalyticsEventModel.audio_listen_count)
        )
        result = await self.context.execute(statement)
        count = result.scalar_one()
        await self.context.commit()
        return count

    async def disconnect_visitor(self, event_id: UUID) -> None:
        await self.context.execute(
            update(AnalyticsEventModel)
            .where(
                AnalyticsEventModel.id == event_id,
                AnalyticsEventModel.event_type
                == AnalyticsEventType.VISITOR_CONNECTION.value,
                AnalyticsEventModel.disconnected_at.is_(None),
            )
            .values(disconnected_at=func.now())
        )
        await self.context.commit()

    async def disconnect_all_visitors(self) -> None:
        await self.context.execute(
            update(AnalyticsEventModel)
            .where(
                AnalyticsEventModel.event_type
                == AnalyticsEventType.VISITOR_CONNECTION.value,
                AnalyticsEventModel.disconnected_at.is_(None),
            )
            .values(disconnected_at=func.now())
        )
        await self.context.commit()

    async def get_presence_counts(self) -> tuple[int, int]:
        connected_visitors = await self.context.scalar(
            select(func.count(distinct(AnalyticsEventModel.session_id))).where(
                AnalyticsEventModel.event_type
                == AnalyticsEventType.VISITOR_CONNECTION.value,
                AnalyticsEventModel.disconnected_at.is_(None),
            )
        )
        total_connections = await self.context.scalar(
            select(func.count())
            .select_from(AnalyticsEventModel)
            .where(
                AnalyticsEventModel.event_type
                == AnalyticsEventType.VISITOR_CONNECTION.value,
            )
        )
        return connected_visitors or 0, total_connections or 0
