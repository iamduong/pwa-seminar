import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  PoiOwnerContext,
  type OwnerContextStatus,
} from "../contexts/poi-owner"
import { useAuth } from "../hooks/use-auth"
import { getApiErrorMessage } from "../lib/api"
import {
  ownerService,
  type OwnerRegistration,
} from "../services/OwnerService"

interface PoiOwnerProviderProps {
  children: ReactNode
}

export function PoiOwnerProvider({ children }: PoiOwnerProviderProps) {
  const { status: authStatus, user } = useAuth()
  const fetchedForUser = useRef<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<OwnerContextStatus>("idle")
  const [registration, setRegistration] = useState<OwnerRegistration | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const shouldLoadRegistration =
    authStatus === "authenticated" &&
    Boolean(user?.ownerSummary) &&
    !user?.isPoiOwnerVerified

  const loadRegistration = useCallback(async () => {
    setRequestStatus("loading")
    setErrorMessage(null)

    try {
      const response = await ownerService.getRegistrationStatus()
      setRegistration(response.data)
      setRequestStatus("ready")
    } catch (error) {
      setRegistration(null)
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải trạng thái hồ sơ đăng ký."),
      )
      setRequestStatus("error")
    }
  }, [])

  useEffect(() => {
    if (!shouldLoadRegistration || !user) return
    if (fetchedForUser.current === user.id) return

    fetchedForUser.current = user.id
    void loadRegistration()
  }, [loadRegistration, shouldLoadRegistration, user])

  const value = useMemo(
    () => ({
      status: shouldLoadRegistration ? requestStatus : "idle" as const,
      registration: shouldLoadRegistration ? registration : null,
      errorMessage: shouldLoadRegistration ? errorMessage : null,
      reload: loadRegistration,
    }),
    [shouldLoadRegistration, requestStatus, registration, errorMessage, loadRegistration],
  )

  return <PoiOwnerContext.Provider value={value}>{children}</PoiOwnerContext.Provider>
}
