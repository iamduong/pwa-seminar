import { ChevronLeftIcon, MapPinIcon } from "lucide-react"
import { Link, useLocation } from "react-router"

import { useAuth } from "#hooks/use-auth"

const pageTitles: Record<string, string> = {
  "/trang-chu": "Địa điểm",
  "/mon-an": "Món ăn",
  "/gan-toi": "Gần tôi",
  "/quet-qr": "Quét QR",
  "/ho-so": "Hồ sơ",
  "/dang-ky-chu-quan": "Hồ sơ chủ quán",
}

export function UserHeader() {
  const location = useLocation()
  const { user } = useAuth()
  const title = pageTitles[location.pathname] ?? "Quan4 Tourism"
  const isOwnerPage = location.pathname === "/dang-ky-chu-quan"

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
        {isOwnerPage ? (
          <Link
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-card text-foreground shadow-sm transition-transform active:scale-95"
            to="/ho-so"
            aria-label="Quay lại hồ sơ"
          >
            <ChevronLeftIcon className="size-5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <MapPinIcon className="size-4" aria-hidden="true" />
          </span>
        )}

        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight">{title}</h1>

        {!isOwnerPage && (
          <Link
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition-transform active:scale-95"
            to="/ho-so"
            aria-label="Mở hồ sơ"
          >
            {user?.fullName.charAt(0).toUpperCase()}
          </Link>
        )}
      </div>
    </header>
  )
}
