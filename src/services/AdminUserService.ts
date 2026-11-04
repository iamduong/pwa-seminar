import api from "#lib/api";
import type { ApiResponse } from "#lib/api";

import type {
  AdminUser,
  AdminUserPagination,
  FilterAdminUser,
} from "../types/AdminUser";

export interface CreateAdminUserPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}

class AdminUserService {
  async PaginationAdminUser(
    params: FilterAdminUser,
    signal?: AbortSignal,
  ) {
    const response = await api.get<ApiResponse<AdminUserPagination>>(
      "/admin-users",
      {
        params: {
          ...params,
          q: params.q?.trim() || undefined,
        },
        signal,
      },
    );

    return response.data;
  }

  async CreateAdminUser(payload: CreateAdminUserPayload) {
    const response = await api.post<ApiResponse<AdminUser>>(
      "/admin-users",
      payload,
    );

    return response.data;
  }
}

export const adminUserService = new AdminUserService();
