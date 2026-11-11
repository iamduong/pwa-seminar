import { Outlet } from "react-router"

import { AdminSidebar } from "#components/layout/AdminSidebar"
import { AiAdvisorWidget } from "#components/ai/AiAdvisorWidget"
import { useAuthorize } from "#hooks/use-authorize"
import { Separator } from "#components/ui/separator"
import { OwnerNotificationBell } from "#components/notifications/OwnerNotificationBell"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "#components/ui/sidebar"

export function AdminLayout() {
  const { session } = useAuthorize()
  const permissions = session?.role?.permissions ?? []
  const canUseContentAdvisor =
    permissions.includes("poi:create") ||
    permissions.includes("owner:poi_submit")
  const canReadNotifications = permissions.includes("owner_notification:read")

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <Separator className="h-4" orientation="vertical" />
          <span className="text-sm font-medium">Cổng quản lý đối tác</span>
          <div className="ml-auto">
            {canReadNotifications && <OwnerNotificationBell />}
          </div>
        </header>
        <div className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
      {canUseContentAdvisor && <AiAdvisorWidget />}
    </SidebarProvider>
  )
}
