import api, { type ApiResponse } from "#lib/api";
import type { PoiPagination } from "../types/Poi";

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
}

export const poiService = new PoiService();
