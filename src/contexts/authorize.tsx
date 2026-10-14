import { createContext } from "react"

import type {
  AuthOwnerRegistration,
  AuthRole,
  LoginPayload,
} from "../services/AuthService"

export type AuthStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "error"

export interface AuthUser {
  id: string
  fullName: string
  email: string
  phone: string
  isActive: boolean
  isPoiOwnerVerified: boolean
  ownerSummary: AuthOwnerRegistration | null
  role: AuthRole | null
}

export interface AuthorizeContextValue {
  status: AuthStatus
  user: AuthUser | null
  login: (payload: LoginPayload) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

export const AuthorizeContext = createContext<AuthorizeContextValue | null>(null)
