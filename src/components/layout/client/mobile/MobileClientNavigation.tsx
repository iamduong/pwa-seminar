import {
  MapPinPenIcon,
  MapPinnedIcon,
  SoupIcon,
} from "lucide-react"
import { NavLink } from "react-router"

import { ClientMenu } from "#components/layout/client/shared/ClientMenu"

const mobileNavigation = [
  { title: "Trang chủ", href: "/", icon: MapPinnedIcon },
  { title: "Món ăn", href: "/mon-an", icon: SoupIcon },
  { title: "Địa điểm", href: "/dia-diem", icon: MapPinPenIcon },
]

export const MobileClientNavigation = () => {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 px-3">
      <nav
        className="pointer-events-auto mx-auto grid h-17 w-full max-w-130 grid-cols-4 gap-1 rounded-2xl border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl"
        aria-label="Điều hướng chính"
      >
        {mobileNavigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1rem] px-1 text-[10px] font-medium transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate">{item.title}</span>
          </NavLink>
        ))}

        <ClientMenu triggerClassName="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1rem] px-1 text-[10px] font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95" />
      </nav>
    </div>
  )
}
