import api from "#lib/api";
import type { ApiResponse } from "#lib/api";

import type {
  AdminUser,
  AdminUserRoleOption,
  AdminUserPagination,
  FilterAdminUser,
} from "../types/AdminUser";

export interface CreateAdminUserPayload {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role_id: string;
  is_active: boolean;
}

export interface UpdateAdminUserPayload {
  full_name: string;
  role_id: string;
  is_active: boolean;
}

class AdminUserService {
  async RoleOptions(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<AdminUserRoleOption[]>>("/admin-users/role-options", { signal });
    return response.data;
  }

  async GetAdminUser(id: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<AdminUser>>(`/admin-users/${id}`, { signal });
    return response.data;
  }

  async UpdateAdminUser(id: string, payload: UpdateAdminUserPayload) {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin-users/${id}`, payload);
    return response.data;
  }
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
