import axios, { AxiosError, type AxiosResponse } from "axios";

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  errors: Array<{
    field?: string;
    message?: string;
    detail?: unknown;
  }> | null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Network error or timeout
    // if (!error.response) {
    //   console.log("Network error or timeout:", error);
    // }

    // Token is expired or invalid, call refresh token endpoint
    // if (error.response?.status === 401) {
    //   console.log("Unauthorized error, token might be expired or invalid:");
    // }

    // Fobidden or unauthorized, throw error to handle in the component
    // if (error.response?.status === 403) {
    //   console.log("Forbidden error, user might not have permission:");
    // }

    // console.error("API error:", error.response?.data || error.message);
    
    // Other errors, handle later in the component
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(
  error: unknown,
  fallback = "Không thể kết nối đến hệ thống. Vui lòng thử lại.",
) {
  if (error instanceof AxiosError) {
    const response = error.response?.data as Partial<ApiResponse> | undefined;
    return response?.message || fallback;
  }

  return fallback;
}

export default api;
