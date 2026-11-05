import { createContext } from "react"

import type { Role } from "../../types/Authorize"

export type AuthorizeStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "error"

export type OwnerRegistrationFormated = {
  bussiness_name: string
  bussiness_address: string
  admin_note: string | null
  status: "pending" | "approved" | "rejected"
}

export type ProfileSessionFormated = {
  userId: string
  fullName: string
  email: string
  phone: string
  isActive: boolean
  isPoiOwnerVerified: boolean
  poiOwner: OwnerRegistrationFormated | null
  role: Role | null
}

export type AuthorizeContextValue = {
  status: AuthorizeStatus
  session: ProfileSessionFormated | null
  refreshProfile: () => Promise<boolean>
  clearSession: () => void
}

export const AuthorizeContext = createContext<AuthorizeContextValue | null>(null)
