import api, { type ApiResponse } from "#lib/api"

export type OwnerRegistrationStatus = "pending" | "approved" | "rejected"

export interface OwnerRegistration {
  registration_id: string
  user_id: string
  business_name: string
  business_address: string
  status: OwnerRegistrationStatus
  admin_note: string | null
  is_poi_owner_verified: boolean
}

export interface OwnerRegistrationPayload {
  business_name: string
  business_address: string
  id_card: string
}

export interface OwnerRegistrationResult {
  registration_id: string
}

class OwnerService {
  async createRegistration(payload: OwnerRegistrationPayload) {
    const response = await api.post<ApiResponse<OwnerRegistrationResult>>(
      "/owner/registrations",
      payload,
    )
    return response.data
  }

  async getRegistrationStatus() {
    const response = await api.get<ApiResponse<OwnerRegistration>>(
      "/owner/registration-status",
    )
    return response.data
  }
}

export const ownerService = new OwnerService()

export default OwnerService
