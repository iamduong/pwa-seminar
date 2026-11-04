import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type {
  PoiSubmission,
  PoiSubmissionPagination,
  PoiSubmissionStatus,
  RegisterPoiSubmissionPayload,
  ReviewPoiSubmissionPayload,
} from "../types/PoiSubmission";

export interface PoiSubmissionQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: PoiSubmissionStatus;
}

class PoiSubmissionService {
  async GetPoiSubmissions(query: PoiSubmissionQuery = {}) {
    const { page = 1, pageSize = 20, q = "", status } = query;
    const response = await api.get<ApiResponse<PoiSubmissionPagination>>(
      "/poi-registrations",
      {
        params: {
          page,
          page_size: pageSize,
          q: q.trim() || undefined,
          status,
        },
      },
    );

    return response.data;
  }

  async GetMyPoiSubmissions(
    query: PoiSubmissionQuery = {},
    signal?: AbortSignal,
  ) {
    const { page = 1, pageSize = 20, q = "", status } = query;
    const response = await api.get<ApiResponse<PoiSubmissionPagination>>(
      "/poi-registrations/mine",
      {
        params: {
          page,
          page_size: pageSize,
          q: q.trim() || undefined,
          status,
        },
        signal,
      },
    );

    return response.data;
  }

  async RegisterPoiSubmission(payload: RegisterPoiSubmissionPayload) {
    const response = await api.post<ApiResponse<PoiSubmission>>(
      "/poi-registrations/register",
      payload,
    );

    return response.data;
  }

  async GetPoiSubmissionById(id: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<PoiSubmission>>(
      `/poi-registrations/${id}`,
      { signal },
    );

    return response.data;
  }

  async ReviewPoiSubmission(
    id: string,
    payload: ReviewPoiSubmissionPayload,
  ) {
    const response = await api.post<ApiResponse<PoiSubmission>>(
      `/poi-registrations/review/${id}`,
      payload,
    );

    return response.data;
  }
}

export const poiSubmissionService = new PoiSubmissionService();
