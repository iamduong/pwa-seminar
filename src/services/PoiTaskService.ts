import api, { type ApiResponse } from "#lib/api";
import type {
  PoiTask,
  PoiTaskPagination,
  PoiTaskStatus,
  PoiTaskViewStatus,
} from "../types/PoiTask";

export type PoiTaskQuery = {
  page?: number;
  pageSize?: number;
  viewStatus?: PoiTaskViewStatus;
  status?: PoiTaskStatus;
};

class PoiTaskService {
  async GetPoiTasks(query: PoiTaskQuery = {}, signal?: AbortSignal) {
    const { page = 1, pageSize = 100, viewStatus, status } = query;
    const response = await api.get<ApiResponse<PoiTaskPagination>>(
      "/poi-tasks",
      {
        params: {
          page,
          page_size: pageSize,
          view_status: viewStatus,
          status,
        },
        signal,
      },
    );

    return response.data;
  }

  async GetPoiTaskById(taskId: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<PoiTask>>(
      `/poi-tasks/${taskId}`,
      { signal },
    );

    return response.data;
  }

  async RetryPoiTask(taskId: string) {
    const response = await api.post<ApiResponse<PoiTask>>(
      `/poi-tasks/${taskId}/retry`,
    );

    return response.data;
  }

  GetPoiTaskStreamUrl() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
    return `${baseUrl.replace(/\/$/, "")}/poi-tasks/stream`;
  }
}

export const poiTaskService = new PoiTaskService();
