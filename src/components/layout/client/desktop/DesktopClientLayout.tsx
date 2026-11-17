import {
  MapPinPenIcon,
  MapPinnedIcon,
  MapPinIcon,
  LuggageIcon,
} from "lucide-react"
import { NavLink, Outlet, useLocation } from "react-router"

import { ClientMenu } from "#components/layout/client/shared/ClientMenu"
import { useUiBundle } from "#hooks/use-ui-bundle"

const desktopNavigation = [
  { titleKey: "navigation.home", href: "/", icon: MapPinnedIcon },
  { titleKey: "navigation.places", href: "/dia-diem", icon: MapPinPenIcon },
  { titleKey: "navigation.travel", href: "/du-lich", icon: LuggageIcon },
]

const desktopPageTitles: Record<string, string> = {
  "/": "page.map.title",
  "/mon-an": "page.food.title",
  "/dia-diem": "page.places.title",
  "/du-lich": "page.travel.title",
}

export function DesktopClientLayout() {
  const location = useLocation()
  const { t } = useUiBundle()
  const titleKey = desktopPageTitles[location.pathname]
  const title = titleKey ? t(titleKey) : "Quan4 Tourism"

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
              <p className="text-xs text-muted-foreground">{t("brand.subtitle")}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-1" aria-label={t("navigation.main.ariaLabel")}>
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
                <span>{t(item.titleKey)}</span>
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
