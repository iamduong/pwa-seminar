from datetime import date, datetime

from pydantic import BaseModel, model_validator


class FilterDashboardStatistics(BaseModel):
    date_from: date | None = None
    date_to: date | None = None

    @model_validator(mode="after")
    def validate_date_range(self):
        if (
            self.date_from is not None
            and self.date_to is not None
            and self.date_from > self.date_to
        ):
            raise ValueError("Ngày bắt đầu không được sau ngày kết thúc")
        return self


class ViewDashboardStatistics(BaseModel):
    total_connections: int
    total_pois: int
    running_poi_tasks: int


class ViewConnectionStatisticsSummary(BaseModel):
    total_connections: int
    unique_visitors: int
    average_duration_seconds: float


class ViewConnectionDailyPoint(BaseModel):
    date: date
    connections: int
    unique_visitors: int


class ViewConnectionRecord(BaseModel):
    id: str
    session_id: str
    connected_at: datetime
    disconnected_at: datetime | None
    duration_seconds: float


class ViewConnectionStatistics(BaseModel):
    summary: ViewConnectionStatisticsSummary
    daily: list[ViewConnectionDailyPoint]
    recent_connections: list[ViewConnectionRecord]


class ViewAudioStatisticsSummary(BaseModel):
    total_listens: int
    listened_pois: int
    total_pois: int
    average_listens_per_listened_poi: float


class ViewPoiAudioStatistics(BaseModel):
    poi_id: str
    name: str
    category_name: str
    audio_status: str
    audio_listen_count: int
    last_listened_at: datetime | None


class ViewAudioStatistics(BaseModel):
    summary: ViewAudioStatisticsSummary
    pois: list[ViewPoiAudioStatistics]
