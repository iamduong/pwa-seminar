import type { ComponentType } from "react"

import { useIsMobile } from "#hooks/use-mobile"

type ResponsiveClientPageProps = {
  mobile: ComponentType
  desktop: ComponentType
}

export function ResponsiveClientPage({
  mobile: MobilePage,
  desktop: DesktopPage,
}: ResponsiveClientPageProps) {
  const isMobile = useIsMobile()

  return isMobile ? <MobilePage /> : <DesktopPage />
}
