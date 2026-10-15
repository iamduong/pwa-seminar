import api, { type ApiResponse } from "#lib/api"

// * API: /admin/auth/login
export interface LoginPayload {
  identifier: string
  password: string
}

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  phone: string
}

export interface RegisterResult {
  user_id: string
}

// * API: /admin/auth/me
export interface AuthRole {
  name: string
  permissions: string[]
}

export interface AuthOwnerRegistration {
  business_name: string
  business_address: string
  admin_note: string | null
  status: "pending" | "approved" | "rejected"
}

export interface AuthenticatedProfile {
  is_login?: true
  user_id: string
  full_name: string
  email: string
  phone: string
  is_active: boolean
  is_poi_owner_verified?: boolean
  poi_owner: AuthOwnerRegistration | null
  role: AuthRole | null
}

class AuthService {
  async login(payload: LoginPayload) {
    const response = await api.post<ApiResponse>("/admin/auth/login", payload)
    return response.data
  }

  async register(payload: RegisterPayload) {
    const response = await api.post<ApiResponse<RegisterResult>>(
      "/admin/auth/register",
      payload,
    )
    return response.data
  }

  async getCurrentProfile() {
    const response = await api.get<ApiResponse<AuthenticatedProfile>>("/admin/auth/me")
    return response.data
  }

  async refresh() {
    const response = await api.post<ApiResponse>("/admin/auth/refresh")
    return response.data
  }

  async logout() {
    const response = await api.post<ApiResponse>("/admin/auth/logout")
    return response.data
  }
}

export const authService = new AuthService()

export default AuthService
