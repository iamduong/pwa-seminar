import { Outlet } from "react-router"

import { ClientHeader } from "#components/layout/ClientHeader"
import { ClientNavigation } from "#components/layout/ClientNavigation"

export const ClientLayout = () => {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ClientHeader />
      <main className="mx-auto min-h-[calc(100dvh-5rem)] max-w-3xl px-4 pt-5 pb-28 sm:px-6 sm:pt-7">
        <Outlet />
      </main>
      <ClientNavigation />
    </div>
  )
}
