import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type { PoiOwnerRegistrationStatus } from "../types/PoiOwnerRegistration";
import type {
  PoiOwnerRegistration,
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

export interface ReviewPoiOwnerRegistrationPayload {
  status: "approved" | "rejected";
  admin_note?: string;
}

export interface ReviewedPoiOwnerRegistration {
  registration_id: string;
  user_id: string;
  status: PoiOwnerRegistrationStatus;
  admin_note: string;
  is_poi_owner_verified: boolean;
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

  async ReRegisterPoiOwner(payload: RegisterPoiOwnerRegistration) {
    const response = await api.post<ApiResponse<RegisteredPoiOwner>>(
      "/poi-owner-registrations/re-register",
      payload,
    );

    return response.data;
  }

  async GetSelfRegistrations(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<PoiOwnerRegistration[]>>(
      "/poi-owner-registrations/self-registration",
      { signal },
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

  async ReviewPoiOwnerRegistration(
    id: string,
    payload: ReviewPoiOwnerRegistrationPayload,
  ) {
    const response = await api.patch<ApiResponse<ReviewedPoiOwnerRegistration>>(
      `/poi-owner-registrations/review-registration/${id}`,
      payload,
    );

    return response.data;
  }
}

export const poiOwnerRegistrationService = new PoiOwnerRegistrationService();
