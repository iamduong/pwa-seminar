import {
  ChevronRightIcon,
  LanguagesIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  ShieldCheckIcon,
  StoreIcon,
} from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthorize } from "../../providers/AuthorizeProvider"
import { authorizeService } from "../../services/AuthorizeService"

const ownerStatusMeta = {
  pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Cần bổ sung", className: "bg-rose-100 text-rose-800" },
} as const

export function ProfilePage() {
  const navigate = useNavigate()
  const { session } = useAuthorize()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Check role to open admin portal
  const canOpenPortal = session?.role && session.isPoiOwnerVerified;
  const showOwnerRegistration = !session?.poiOwner
  const showOwnerProfile =
    session?.poiOwner?.status === "pending" ||
    session?.poiOwner?.status === "approved"

  const ownerStatus = session?.poiOwner
    ? ownerStatusMeta[session?.poiOwner.status]
    : null

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      await authorizeService.Logout()
      navigate("/dang-nhap", { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
        <div className="absolute -top-14 -right-12 size-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 -bottom-16 size-32 rounded-full bg-primary-foreground/10" />
        <div className="relative flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold ring-1 ring-white/20 backdrop-blur">
            {session?.fullName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{session?.fullName}</p>
            <p className="truncate text-sm text-white/70">{session?.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white/90">
              <ShieldCheckIcon className="size-3.5" aria-hidden="true" />
              {session?.role?.name ?? "Người dùng"}
            </span>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-2 px-1 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Tùy chọn cá nhân
        </p>
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <button className="flex w-full items-center gap-3 border-b px-4 py-4 text-left transition-colors hover:bg-muted/60 active:bg-muted" type="button">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <LanguagesIcon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Ngôn ngữ</span>
              <span className="block text-xs text-muted-foreground">Tiếng Việt</span>
            </span>
            <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>

          {(showOwnerRegistration || showOwnerProfile) && (
            <Link className="flex items-center gap-3 border-b px-4 py-4 transition-colors hover:bg-muted/60 active:bg-muted" to="/dang-ky-chu-quan">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <StoreIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {session?.poiOwner ? "Hồ sơ chủ quán" : "Đăng ký chủ quán"}
                  </span>
                  {ownerStatus && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ownerStatus.className}`}>
                      {ownerStatus.label}
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {session?.poiOwner
                    ? "Xem thông tin và trạng thái hồ sơ"
                    : "Trở thành đối tác của Quan4 Tourism"}
                </span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          )}

          {canOpenPortal ? (
            <Link className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/60 active:bg-muted" to={"/quan-ly"}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <LayoutDashboardIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-semibold">Portal quản lý</span>
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          ) : (
            <div className="flex items-center gap-3 px-4 py-4 opacity-45">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5">
                <LayoutDashboardIcon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Portal quản lý</span>
                <span className="block truncate text-xs">Cần được phê duyệt quyền chủ quán</span>
              </span>
            </div>
          )}
        </div>
      </section>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3.5 text-sm font-semibold text-destructive shadow-sm transition-all hover:bg-destructive/5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        type="button"
        onClick={() => void handleLogout()}
        disabled={isLoggingOut}
      >
        <LogOutIcon className="size-4" aria-hidden="true" />
        {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
    </div>
  )
}
