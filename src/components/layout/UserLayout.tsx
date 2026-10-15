import { Outlet } from "react-router"

import { BottomNavigation } from "#components/user/BottomNavigation"
import { UserHeader } from "#components/user/UserHeader"

export function UserLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <UserHeader />
      <main className="mx-auto min-h-[calc(100dvh-5rem)] max-w-3xl px-4 pt-5 pb-28 sm:px-6 sm:pt-7">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}
