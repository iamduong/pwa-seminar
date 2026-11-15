import api, { type ApiResponse } from "#lib/api";

export type DashboardStatisticsQuery = {
  dateFrom?: string;
  dateTo?: string;
};

export type DashboardStatistics = {
  total_connections: number;
  total_pois: number;
  running_poi_tasks: number;
};

export type ConnectionStatistics = {
  summary: {
    total_connections: number;
    unique_visitors: number;
    average_duration_seconds: number;
  };
  daily: Array<{
    date: string;
    connections: number;
    unique_visitors: number;
  }>;
  recent_connections: Array<{
    id: string;
    session_id: string;
    connected_at: string;
    disconnected_at: string | null;
    duration_seconds: number;
  }>;
};

export type AudioStatistics = {
  summary: {
    total_listens: number;
    listened_pois: number;
    total_pois: number;
    average_listens_per_listened_poi: number;
  };
  pois: Array<{
    poi_id: string;
    name: string;
    category_name: string;
    audio_status: string;
    audio_listen_count: number;
    last_listened_at: string | null;
  }>;
};

class DashboardStatisticsService {
  async getStatistics(
    query: DashboardStatisticsQuery = {},
    signal?: AbortSignal,
  ) {
    const response = await api.get<ApiResponse<DashboardStatistics>>(
      "/dashboard/statistics",
      {
        params: {
          date_from: query.dateFrom || undefined,
          date_to: query.dateTo || undefined,
        },
        signal,
      },
    );
    return response.data;
  }

  async getConnectionStatistics(
    query: DashboardStatisticsQuery,
    signal?: AbortSignal,
  ) {
    const response = await api.get<ApiResponse<ConnectionStatistics>>(
      "/dashboard/statistics/connections",
      {
        params: {
          date_from: query.dateFrom || undefined,
          date_to: query.dateTo || undefined,
        },
        signal,
      },
    );
    return response.data;
  }

  async getAudioStatistics(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<AudioStatistics>>(
      "/dashboard/statistics/audio-plays",
      { signal },
    );
    return response.data;
  }
}

export const dashboardStatisticsService = new DashboardStatisticsService();
