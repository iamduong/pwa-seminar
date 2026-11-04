import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type { PoiOwnerRegistrationStatus } from "../types/contract/GeoPoint";
import type {
  RegisterPoiOwnerRegistration,
  PoiOwnerRegistrationPagination,
} from "../types/PoiOwnerRegistration";

export interface PoiOwnerRegistrationQuery {
  q?: string;
  page?: number;
  pageSize?: number;
  status?: PoiOwnerRegistrationStatus;
}

export interface RegisteredPoiOwner {
  registration_id: string;
  status: PoiOwnerRegistrationStatus;
}

class PoiOwnerRegistrationService {
  // Register new Poi Owner
  async RegisterPoiOwner(payload: RegisterPoiOwnerRegistration) {
    const response = await api.post<ApiResponse<RegisteredPoiOwner>>(
      "/poi-owner-registrations/register",
      payload,
    );

    return response.data;
  }

  // Pagination
  async PaginationPoiOwnerRegistration(
    query: PoiOwnerRegistrationQuery = {},
    signal?: AbortSignal,
  ) {
    const { q = "", page = 1, pageSize = 20, status } = query;
    const response = await api.get<ApiResponse<PoiOwnerRegistrationPagination>>(
      "/poi-owner-registrations",
      {
        params: {
          q: q.trim() || undefined,
          page,
          page_size: pageSize,
          status,
        },
        signal,
      },
    );

    return response.data;
  }
}

export const poiOwnerRegistrationService = new PoiOwnerRegistrationService();
