import { MapPinIcon } from "lucide-react"
import { useEffect } from "react"
import { useLocation } from "react-router"

import { useUiBundle } from "#hooks/use-ui-bundle"

const mobilePageTitleKeys: Record<string, string> = {
  "/": "page.map.title",
  "/mon-an": "page.food.title",
  "/dia-diem": "page.places.title",
}

export const MobileClientHeader = () => {
  const location = useLocation()
  const { t } = useUiBundle()
  const titleKey = mobilePageTitleKeys[location.pathname]
  const title = titleKey ? t(titleKey) : "Quan4 Tourism"

  useEffect(() => {
    document.title = `${title} | Quan4 Tourism`
  }, [title])

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
