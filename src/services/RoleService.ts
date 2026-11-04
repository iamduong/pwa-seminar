import api from "#lib/api";
import type { ApiResponse } from "#lib/api";
import type {
  CreateRolePayload,
  Role,
  RolePagination,
  UpdateRolePayload,
} from "../types/Role";

export interface RoleQuery {
  q?: string;
  page?: number;
  pageSize?: number;
  isDeleted?: boolean;
}

class RoleService {
  async getPermissions(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<string[]>>("/roles/permissions", {
      signal,
    });

    return response.data;
  }

  async getRoles(query: RoleQuery = {}, signal?: AbortSignal) {
    const { q = "", page = 1, pageSize = 20, isDeleted = false } = query;
    const response = await api.get<ApiResponse<RolePagination>>("/roles", {
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

  async getRole(id: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<Role>>(`/roles/${id}`, { signal });
    return response.data;
  }

  async createRole(payload: CreateRolePayload) {
    const response = await api.post<ApiResponse<Role>>("/roles", payload);
    return response.data;
  }

  async updateRole(id: string, payload: UpdateRolePayload) {
    const response = await api.patch<ApiResponse<Role>>(`/roles/${id}`, payload);
    return response.data;
  }

  async deleteRole(id: string) {
    const response = await api.delete<ApiResponse<null>>(`/roles/${id}`);
    return response.data;
  }

  async restoreRole(id: string) {
    const response = await api.patch<ApiResponse<Role>>(`/roles/${id}/restore`);
    return response.data;
  }
}

export const roleService = new RoleService();
