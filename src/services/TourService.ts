import api, { type ApiResponse } from "#lib/api";
import type {
  CreateTourPayload,
  Tour,
  TourPagination,
  TourPoi,
} from "../types/Tour";

export type TourQuery = {
  q?: string;
  page?: number;
  pageSize?: number;
  isDeleted?: boolean;
};

class TourService {
  async list(query: TourQuery = {}, signal?: AbortSignal) {
    const { q = "", page = 1, pageSize = 20, isDeleted = false } = query;
    const response = await api.get<ApiResponse<TourPagination>>("/tours", {
      params: {
        q: q.trim() || undefined,
        page,
        page_size: pageSize,
        is_deleted: isDeleted,
      },
      signal,
    });
    return response.data;
  }

  async listPoiOptions(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<TourPoi[]>>("/tours/poi-options", {
      signal,
    });
    return response.data;
  }

  async create(payload: CreateTourPayload) {
    const response = await api.post<ApiResponse<Tour>>("/tours", payload);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete<ApiResponse<null>>(`/tours/${id}`);
    return response.data;
  }

  async restore(id: string) {
    const response = await api.patch<ApiResponse<Tour>>(`/tours/${id}/restore`);
    return response.data;
  }

  async detailByCode(code: string) {
    const response = await api.get<ApiResponse<Tour>>(`/tours/${encodeURIComponent(code)}`);
    return response.data;
  }
}

export const tourService = new TourService();
