import api, { type ApiResponse } from "#lib/api"
import type { PoiCategoryCode } from "../components/map/types"

export type PoiSubmissionStatus = "pending" | "approved" | "rejected"

export interface PoiCategory {
  id: string
  code: PoiCategoryCode
  name: string
}

export interface PoiSubmissionOwner {
  id: string
  full_name: string
  email: string
  phone: string
}

export interface PoiSubmission {
  id: string
  owner_id: string
  poi_id: string | null
  name: string
  description: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  images: string[]
  trigger_radius: number
  owner_note: string
  status: PoiSubmissionStatus
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  owner: PoiSubmissionOwner
  category: PoiCategory
}

export interface CreatePoiSubmissionPayload {
  category_id: string
  name: string
  description: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  images: string[]
  trigger_radius: number
  owner_note: string
}

export interface PoiSubmissionPagination {
  items: PoiSubmission[]
  page: number
  page_size: number
  item_count: number
  total_items: number
  total_pages: number
}

export interface OwnerPoi {
  id: string
  owner_id: string
  name: string
  description: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number]
  }
  images: string[]
  trigger_radius: number
  is_active: boolean
  audio_status: "pending" | "processing" | "ready" | "failed"
  created_at: string
  updated_at: string
  category: PoiCategory
}

export interface AdminSubmissionFilters {
  page?: number
  page_size?: number
  status?: PoiSubmissionStatus
  address?: string
  category_id?: string
}

class PoiSubmissionService {
  async getCategories(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<PoiCategory[]>>("/categories", {
      signal,
    })
    return response.data
  }

  async create(payload: CreatePoiSubmissionPayload) {
    const response = await api.post<ApiResponse<PoiSubmission>>(
      "/owner/poi-submissions",
      payload,
    )
    return response.data
  }

  async getOwnerSubmissions(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<PoiSubmission[]>>(
      "/owner/poi-submissions",
      { signal },
    )
    return response.data
  }

  async getAdminSubmissions(filters: AdminSubmissionFilters, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<PoiSubmissionPagination>>(
      "/admin/poi-submissions",
      {
        params: filters,
        signal,
      },
    )
    return response.data
  }

  async getAdminSubmission(submissionId: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<PoiSubmission>>(
      `/admin/poi-submissions/${submissionId}`,
      { signal },
    )
    return response.data
  }

  async getOwnerPois(signal?: AbortSignal) {
    const response = await api.get<ApiResponse<OwnerPoi[]>>("/owner/pois", {
      signal,
    })
    return response.data
  }

  async getOwnerPoi(poiId: string, signal?: AbortSignal) {
    const response = await api.get<ApiResponse<OwnerPoi>>(`/owner/pois/${poiId}`, {
      signal,
    })
    return response.data
  }

  async review(
    submissionId: string,
    status: Exclude<PoiSubmissionStatus, "pending">,
    adminNote: string,
  ) {
    const response = await api.patch<ApiResponse<PoiSubmission>>(
      `/admin/poi-submissions/${submissionId}`,
      { status, admin_note: adminNote },
    )
    return response.data
  }
}

export const poiSubmissionService = new PoiSubmissionService()
