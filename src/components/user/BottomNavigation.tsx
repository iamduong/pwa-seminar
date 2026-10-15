import {
  CircleUserRoundIcon,
  LocateFixedIcon,
  MapPinnedIcon,
  QrCodeIcon,
  SoupIcon,
} from "lucide-react"
import { NavLink } from "react-router"

const navigation = [
  { title: "Địa điểm", href: "/trang-chu", icon: MapPinnedIcon },
  { title: "Món ăn", href: "/mon-an", icon: SoupIcon },
  { title: "Gần tôi", href: "/gan-toi", icon: LocateFixedIcon },
  { title: "Quét QR", href: "/quet-qr", icon: QrCodeIcon },
  { title: "Hồ sơ", href: "/ho-so", icon: CircleUserRoundIcon },
]

export function BottomNavigation() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 px-3"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        className="pointer-events-auto mx-auto grid h-[4.25rem] max-w-xl grid-cols-5 gap-1 rounded-2xl border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl"
        aria-label="Điều hướng chính"
      >
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
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
      </nav>
    </div>
  )
}
