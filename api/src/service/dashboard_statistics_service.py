from core.dependency import PostgresDB
from repository.dashboard_statistics_repository import DashboardStatisticsRepository
from schema.dashboard_statistics_schema import (
    FilterDashboardStatistics,
    ViewAudioStatistics,
    ViewAudioStatisticsSummary,
    ViewConnectionDailyPoint,
    ViewConnectionRecord,
    ViewConnectionStatistics,
    ViewConnectionStatisticsSummary,
    ViewDashboardStatistics,
    ViewPoiAudioStatistics,
)


class DashboardStatisticsService:
    def __init__(self, db: PostgresDB):
        self.repository = DashboardStatisticsRepository(db)

    async def get_statistics(
        self,
        filters: FilterDashboardStatistics,
    ) -> ViewDashboardStatistics:
        total_connections, total_pois, running_poi_tasks = (
            await self.repository.get_statistics(filters.date_from, filters.date_to)
        )
        return ViewDashboardStatistics(
            total_connections=total_connections,
            total_pois=total_pois,
            running_poi_tasks=running_poi_tasks,
        )

    async def get_connection_statistics(
        self,
        filters: FilterDashboardStatistics,
    ) -> ViewConnectionStatistics:
        (
            total_connections,
            unique_visitors,
            average_duration_seconds,
            daily_rows,
            recent_connections,
        ) = await self.repository.get_connection_statistics(
            filters.date_from,
            filters.date_to,
        )
        return ViewConnectionStatistics(
            summary=ViewConnectionStatisticsSummary(
                total_connections=total_connections,
                unique_visitors=unique_visitors,
                average_duration_seconds=average_duration_seconds,
            ),
            daily=[
                ViewConnectionDailyPoint(
                    date=row.date,
                    connections=row.connections,
                    unique_visitors=row.unique_visitors,
                )
                for row in daily_rows
            ],
            recent_connections=[
                ViewConnectionRecord(
                    id=str(event.id),
                    session_id=str(event.session_id),
                    connected_at=event.occurred_at,
                    disconnected_at=event.disconnected_at,
                    duration_seconds=max(
                        0,
                        (
                            event.disconnected_at - event.occurred_at
                        ).total_seconds(),
                    ) if event.disconnected_at else 0,
                )
                for event in recent_connections
            ],
        )

    async def get_audio_statistics(self) -> ViewAudioStatistics:
        total_listens, listened_pois, rows = (
            await self.repository.get_audio_statistics()
        )
        total_pois = len(rows)
        return ViewAudioStatistics(
            summary=ViewAudioStatisticsSummary(
                total_listens=total_listens,
                listened_pois=listened_pois,
                total_pois=total_pois,
                average_listens_per_listened_poi=(
                    total_listens / listened_pois if listened_pois else 0
                ),
            ),
            pois=[
                ViewPoiAudioStatistics(
                    poi_id=str(row.poi_id),
                    name=row.name,
                    category_name=row.category_name,
                    audio_status=row.audio_status,
                    audio_listen_count=row.audio_listen_count,
                    last_listened_at=row.last_listened_at,
                )
                for row in rows
            ],
        )
