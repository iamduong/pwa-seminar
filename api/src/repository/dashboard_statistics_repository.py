from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from core.dependency import PostgresDB
from model.analytics_event_model import AnalyticsEventModel, AnalyticsEventType
from model.poi_model import PoiModel
from model.poi_task_model import PoiTaskModel, PoiTaskStatus
from sqlalchemy import and_, distinct, func, select


APPLICATION_TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")


def _utc_day_boundary(value: date) -> datetime:
    return datetime.combine(value, time.min, APPLICATION_TIMEZONE).astimezone(UTC)


class DashboardStatisticsRepository:
    def __init__(self, context: PostgresDB):
        self.context = context

    @staticmethod
    def _date_conditions(column, date_from: date | None, date_to: date | None):
        conditions = []
        if date_from is not None:
            conditions.append(column >= _utc_day_boundary(date_from))
        if date_to is not None:
            conditions.append(
                column < _utc_day_boundary(date_to + timedelta(days=1))
            )
        return conditions

    async def get_statistics(
        self,
        date_from: date | None,
        date_to: date | None,
    ) -> tuple[int, int, int]:
        total_connections = await self.context.scalar(
            select(func.count())
            .select_from(AnalyticsEventModel)
            .where(
                AnalyticsEventModel.event_type
                == AnalyticsEventType.VISITOR_CONNECTION.value,
                AnalyticsEventModel.deleted_at.is_(None),
                *self._date_conditions(
                    AnalyticsEventModel.occurred_at,
                    date_from,
                    date_to,
                ),
            )
        )
        total_pois = await self.context.scalar(
            select(func.count())
            .select_from(PoiModel)
            .where(
                PoiModel.deleted_at.is_(None),
                *self._date_conditions(PoiModel.created_at, date_from, date_to),
            )
        )
        running_poi_tasks = await self.context.scalar(
            select(func.count())
            .select_from(PoiTaskModel)
            .where(
                PoiTaskModel.status == PoiTaskStatus.RUNNING.value,
                PoiTaskModel.deleted_at.is_(None),
                *self._date_conditions(
                    PoiTaskModel.created_at,
                    date_from,
                    date_to,
                ),
            )
        )
        return (
            total_connections or 0,
            total_pois or 0,
            running_poi_tasks or 0,
        )

    async def get_connection_statistics(
        self,
        date_from: date | None,
        date_to: date | None,
    ):
        conditions = [
            AnalyticsEventModel.event_type
            == AnalyticsEventType.VISITOR_CONNECTION.value,
            AnalyticsEventModel.deleted_at.is_(None),
            *self._date_conditions(
                AnalyticsEventModel.occurred_at,
                date_from,
                date_to,
            ),
        ]
        total_connections = await self.context.scalar(
            select(func.count()).select_from(AnalyticsEventModel).where(*conditions)
        )
        unique_visitors = await self.context.scalar(
            select(func.count(distinct(AnalyticsEventModel.session_id))).where(
                *conditions
            )
        )
        average_duration = await self.context.scalar(
            select(
                func.avg(
                    func.extract(
                        "epoch",
                        AnalyticsEventModel.disconnected_at
                        - AnalyticsEventModel.occurred_at,
                    )
                )
            ).where(
                *conditions,
                AnalyticsEventModel.disconnected_at.is_not(None),
            )
        )

        day = func.date(
            func.timezone(
                "Asia/Ho_Chi_Minh",
                AnalyticsEventModel.occurred_at,
            )
        ).label("date")
        daily_rows = (
            await self.context.execute(
                select(
                    day,
                    func.count().label("connections"),
                    func.count(distinct(AnalyticsEventModel.session_id)).label(
                        "unique_visitors"
                    ),
                )
                .where(*conditions)
                .group_by(day)
                .order_by(day)
            )
        ).all()
        recent_connections = list(
            (
                await self.context.scalars(
                    select(AnalyticsEventModel)
                    .where(*conditions)
                    .order_by(AnalyticsEventModel.occurred_at.desc())
                    .limit(50)
                )
            ).all()
        )
        return (
            total_connections or 0,
            unique_visitors or 0,
            float(average_duration or 0),
            list(daily_rows),
            recent_connections,
        )

    async def get_audio_statistics(self):
        audio_event_join = and_(
            AnalyticsEventModel.poi_id == PoiModel.id,
            AnalyticsEventModel.event_type
            == AnalyticsEventType.AUDIO_PLAY.value,
            AnalyticsEventModel.deleted_at.is_(None),
        )
        listen_count = func.coalesce(
            AnalyticsEventModel.audio_listen_count,
            0,
        ).label("audio_listen_count")
        rows = (
            await self.context.execute(
                select(
                    PoiModel.id.label("poi_id"),
                    PoiModel.name,
                    PoiModel.category_name,
                    PoiModel.audio_status,
                    listen_count,
                    AnalyticsEventModel.updated_at.label("last_listened_at"),
                )
                .select_from(PoiModel)
                .outerjoin(AnalyticsEventModel, audio_event_join)
                .where(PoiModel.deleted_at.is_(None))
                .order_by(listen_count.desc(), PoiModel.name.asc())
            )
        ).all()

        total_listens = sum(row.audio_listen_count for row in rows)
        listened_pois = sum(1 for row in rows if row.audio_listen_count > 0)
        return total_listens, listened_pois, list(rows)
