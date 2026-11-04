import { MapPinIcon } from "lucide-react"
import { useLocation } from "react-router"

const mobilePageTitles: Record<string, string> = {
  "/": "Địa điểm",
  "/mon-an": "Món ăn",
  "/gan-toi": "Gần tôi",
  "/quet-qr": "Quét QR",
}

export const MobileClientHeader = () => {
  const location = useLocation()
  const title = mobilePageTitles[location.pathname] ?? "Quan4 Tourism"

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-130 items-center gap-3 px-4 sm:px-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <MapPinIcon className="size-4" aria-hidden="true" />
        </span>

        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight">{title}</h1>

      </div>
    </header>
  )
}
