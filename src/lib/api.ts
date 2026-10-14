import axios, { AxiosError } from "axios"

export interface ApiResponse<T = null> {
  success: boolean
  message: string
  data: T | null
  errors: Array<{
    field?: string
    message?: string
    detail?: unknown
  }> | null
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

export function getApiErrorMessage(
  error: unknown,
  fallback = "Không thể kết nối đến hệ thống. Vui lòng thử lại.",
) {
  if (error instanceof AxiosError) {
    const response = error.response?.data as Partial<ApiResponse> | undefined
    return response?.message || fallback
  }

  return fallback
}

export default api
