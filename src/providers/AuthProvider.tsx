import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  AuthorizeContext,
  type AuthStatus,
  type AuthUser,
} from "../contexts/authorize"

import {
  authService,
  type AuthenticatedProfile,
  type LoginPayload,
} from "../services/AuthService"

interface AuthProviderProps {
  children: ReactNode
}

function toAuthUser(profile: AuthenticatedProfile): AuthUser {
  return {
    id: profile.user_id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    isActive: profile.is_active,
    isPoiOwnerVerified: profile.is_poi_owner_verified ?? profile.poi_owner?.status === "approved",
    ownerSummary: profile.poi_owner,
    role: profile.role,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialized = useRef(false)
  const [status, setStatus] = useState<AuthStatus>("checking")
  const [user, setUser] = useState<AuthUser | null>(null)

  const fetchProfile = useCallback(async () => {
    const response = await authService.getCurrentProfile()
    const profile = response.data

    if (!profile || ("is_login" in profile && profile.is_login === false)) {
      setUser(null)
      setStatus("unauthenticated")
      return null
    }

    const currentUser = toAuthUser(profile)
    setUser(currentUser)
    setStatus("authenticated")
    return currentUser
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      await fetchProfile()
    } catch {
      setUser(null)
      setStatus("error")
    }
  }, [fetchProfile])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void refreshProfile()
  }, [refreshProfile])

  const login = useCallback(
    async (payload: LoginPayload) => {
      await authService.login(payload)
      const currentUser = await fetchProfile()

      if (!currentUser) {
        throw new Error("Không thể khởi tạo phiên đăng nhập.")
      }

      return currentUser
    },
    [fetchProfile],
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  const hasPermission = useCallback(
    (permission: string) => user?.role?.permissions.includes(permission) ?? false,
    [user],
  )

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      logout,
      refreshProfile,
      hasPermission,
    }),
    [status, user, login, logout, refreshProfile, hasPermission],
  )

  return <AuthorizeContext.Provider value={value}>{children}</AuthorizeContext.Provider>
}
