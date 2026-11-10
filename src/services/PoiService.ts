import api, { type ApiResponse } from "#lib/api";
import type {
  CreateAdminPoiPayload,
  OwnerPoiDetail,
  Poi,
  PoiPagination,
} from "../types/Poi";

export type OwnerPoiQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

class PoiService {
  async getMyPois(query: OwnerPoiQuery = {}, signal?: AbortSignal) {
    const { page = 1, pageSize = 20, q = "" } = query;
    const response = await api.get<ApiResponse<PoiPagination>>("/pois/mine", {
      params: {
        page,
        page_size: pageSize,
        q: q.trim() || undefined,
      },
      signal,
    });

    return response.data;
  }

  async getMyPoiDetail(poiId: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<OwnerPoiDetail>>(
      `/pois/mine/${poiId}`,
      { signal },
    );
    return response.data;
  }

  async getAdminPois(query: OwnerPoiQuery = {}, signal?: AbortSignal) {
    const { page = 1, pageSize = 20, q = "" } = query;
    const response = await api.get<ApiResponse<PoiPagination>>("/pois", {
      params: {
        page,
        page_size: pageSize,
        q: q.trim() || undefined,
      },
      signal,
    });
    return response.data;
  }

  async getAdminPoiDetail(poiId: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<OwnerPoiDetail>>(
      `/pois/${poiId}/detail`,
      { signal },
    );
    return response.data;
  }

  async createAdminPoi(payload: CreateAdminPoiPayload) {
    const response = await api.post<ApiResponse<Poi>>("/pois", payload);
    return response.data;
  }

  async uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await api.post<ApiResponse<string[]>>(
      "/pois/images",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  }
}

export const poiService = new PoiService();
