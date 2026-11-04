import {
  LocateFixedIcon,
  MapPinnedIcon,
  MapPinIcon,
  QrCodeIcon,
  SoupIcon,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router"

import { ClientMenu } from "#components/layout/client/shared/ClientMenu"

const desktopNavigation = [
  { title: "Trang chủ", href: "/", icon: MapPinnedIcon },
  { title: "Món ăn", href: "/mon-an", icon: SoupIcon },
  { title: "Gần tôi", href: "/gan-toi", icon: LocateFixedIcon },
  { title: "Quét QR", href: "/quet-qr", icon: QrCodeIcon },
]

const desktopPageTitles: Record<string, string> = {
  "/": "Địa điểm",
  "/mon-an": "Món ăn",
  "/gan-toi": "Gần tôi",
  "/quet-qr": "Quét QR",
}

export function DesktopClientLayout() {
  const location = useLocation()
  const title = desktopPageTitles[location.pathname] ?? "Quan4 Tourism"

  return (
    <div className="min-h-dvh bg-background">
      <div className="grid min-h-dvh w-full grid-cols-[17rem_minmax(0,1fr)] bg-background">
        <aside className="sticky top-0 flex h-dvh flex-col border-r bg-card p-4">
          <div className="flex h-12 items-center gap-3 px-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MapPinIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">Quan4 Tourism</p>
              <p className="text-xs text-muted-foreground">Khám phá Quận 4</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1" aria-label="Điều hướng chính">
            {desktopNavigation.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="size-5" aria-hidden="true" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t pt-3">
            <ClientMenu triggerClassName="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-8 backdrop-blur-xl">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </header>
          <main className="p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
