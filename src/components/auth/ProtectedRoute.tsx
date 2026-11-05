import { Loader2Icon } from "lucide-react"
import { Navigate, Outlet, useLocation } from "react-router"

import { Button } from "#components/ui/button"
import { useAuthorize } from "../../hooks/use-authorize"

export function ProtectedRoute() {
  const location = useLocation()
  const { status  } = useAuthorize()

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
          <Button className="mt-5" variant="outline" onClick={() => console.log("Try again")}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/quan-ly/dang-nhap" replace state={{ from }} />
  }

  return <Outlet />
}
