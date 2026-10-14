import { createContext } from "react"

import type { OwnerRegistration } from "../services/OwnerService"

export type OwnerContextStatus = "idle" | "loading" | "ready" | "error"

export interface PoiOwnerContextValue {
  status: OwnerContextStatus
  registration: OwnerRegistration | null
  errorMessage: string | null
  reload: () => Promise<void>
}

export const PoiOwnerContext = createContext<PoiOwnerContextValue | null>(null)
