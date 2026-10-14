import { Loader2Icon } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router"

import { Button } from "#components/ui/button"
import { useAuth } from "#hooks/use-auth"

export function ProtectedRoute() {
  const location = useLocation()
  const { refreshProfile, status, user } = useAuth()

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          Đang kiểm tra phiên đăng nhập...
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="font-semibold">Không thể kiểm tra phiên đăng nhập</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vui lòng kiểm tra kết nối và thử lại.
          </p>
          <Button className="mt-5" variant="outline" onClick={() => void refreshProfile()}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const isUnverifiedOwner = Boolean(
    user?.ownerSummary && !user.isPoiOwnerVerified,
  )
  if (
    isUnverifiedOwner &&
    location.pathname !== "/owner/registration-status"
  ) {
    return <Navigate to="/owner/registration-status" replace />
  }

  return <Outlet />
}
