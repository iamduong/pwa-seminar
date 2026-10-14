import { Outlet } from "react-router"

import { AppSidebar } from "#components/layout/AppSidebar"
import { Separator } from "#components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "#components/ui/sidebar"

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <Separator className="h-4" orientation="vertical" />
          <span className="text-sm font-medium">Cổng quản lý đối tác</span>
        </header>
        <div className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
