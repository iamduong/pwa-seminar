import { Outlet } from "react-router"

import { DesktopClientLayout } from "#components/layout/client/desktop/DesktopClientLayout"
import { MobileClientHeader } from "#components/layout/client/mobile/MobileClientHeader"
import { MobileClientNavigation } from "#components/layout/client/mobile/MobileClientNavigation"
import { useIsMobile } from "#hooks/use-mobile"

export const ClientLayout = () => {
  const isMobile = useIsMobile()

  if (!isMobile) return <DesktopClientLayout />

  return (
    <div className="min-h-dvh bg-muted/50">
      <div className="mx-auto min-h-dvh w-full max-w-130 bg-background text-foreground">
        <MobileClientHeader />
        <main className="mx-auto min-h-[calc(100dvh-5rem)] w-full px-4 pt-5 pb-28 sm:px-6 sm:pt-7">
          <Outlet />
        </main>
        <MobileClientNavigation />
      </div>
    </div>
  )
}
