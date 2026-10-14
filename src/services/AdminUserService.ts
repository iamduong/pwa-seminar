import type { AxiosRequestConfig } from "axios"

import api, { type ApiResponse } from "#lib/api"

export interface AdminUser {
  id: string
  full_name: string
  email: string
  phone: string
  is_active: boolean
  is_poi_owner_verified: boolean
  role_id: string | null
  role_name: string | null
  created_at: string
  updated_at: string
}

export interface AdminUserPagination {
  items: AdminUser[]
  page: number
  page_size: number
  item_count: number
  total_items: number
  total_pages: number
}

export interface AdminUserFilters {
  page: number
  page_size: number
  q?: string
  is_active?: boolean
  is_poi_owner_verified?: boolean
}

class AdminUserService {
  async getAdminUsers(
    filters: AdminUserFilters,
    signal?: AxiosRequestConfig["signal"],
  ) {
    const response = await api.get<ApiResponse<AdminUserPagination>>(
      "/admin/admin-users",
      { params: filters, signal },
    )

    return response.data
  }
}

export const adminUserService = new AdminUserService()

export default AdminUserService
