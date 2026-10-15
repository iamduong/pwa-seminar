import { Navigate, Outlet } from "react-router"

import { useAuth } from "#hooks/use-auth"

export function OwnerRegistrationRoute() {
  const { hasPermission, user } = useAuth()
  const canRegister =
    user?.role?.name === "user" && hasPermission("owner:register")

  if (!canRegister && !user?.ownerSummary) {
    return <Navigate to="/trang-chu" replace />
  }

  return <Outlet />
}

export function ManagementPortalRoute() {
  const { user } = useAuth()
  const isAdministrator =
    user?.role?.name === "admin" || user?.role?.name === "super_admin"
  const isVerifiedOwner =
    user?.role?.name === "poi_owner" && user.isPoiOwnerVerified

  return isAdministrator || isVerifiedOwner ? (
    <Outlet />
  ) : (
    <Navigate to="/trang-chu" replace />
  )
}

interface OwnerManagementRouteProps {
  permission: "owner:submit_poi" | "owner:manage_own_poi"
}

export function OwnerManagementRoute({ permission }: OwnerManagementRouteProps) {
  const { hasPermission, user } = useAuth()

  if (
    user?.role?.name !== "poi_owner" ||
    !user.isPoiOwnerVerified ||
    !hasPermission(permission)
  ) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
