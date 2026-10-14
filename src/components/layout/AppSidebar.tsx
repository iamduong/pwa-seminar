import {
  BarChart3Icon,
  ClipboardCheckIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinnedIcon,
  ShieldCheckIcon,
  StoreIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "#components/ui/sidebar"
import { useAuth } from "#hooks/use-auth"

const navigation = [
  {
    title: "Tổng quan",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    permissions: ["analytics:view", "analytics:view_own"],
  },
  {
    title: "Trạng thái đăng ký",
    href: "/owner/registration-status",
    icon: ClipboardCheckIcon,
    permissions: ["owner:access"],
  },
  {
    title: "Địa điểm",
    href: "/pois",
    icon: MapPinnedIcon,
    permissions: ["poi:read"],
  },
  {
    title: "Cơ sở của tôi",
    href: "/owner/pois",
    icon: StoreIcon,
    permissions: ["owner:manage_own_poi"],
  },
  {
    title: "Thực đơn",
    href: "/menus",
    icon: UtensilsIcon,
    permissions: ["menu:read"],
  },
  {
    title: "Người dùng",
    href: "/users",
    icon: UsersIcon,
    permissions: ["user:read"],
  },
  {
    title: "Kiểm duyệt",
    href: "/moderation",
    icon: ShieldCheckIcon,
    permissions: ["content:moderate", "poi:approve"],
  },
  {
    title: "Báo cáo",
    href: "/analytics",
    icon: BarChart3Icon,
    permissions: ["analytics:view", "analytics:view_own"],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasPermission, logout, user } = useAuth()
  const isUnverifiedOwner = Boolean(
    user?.ownerSummary && !user.isPoiOwnerVerified,
  )

  const permittedNavigation = navigation.filter((item) => {
    if ((isUnverifiedOwner && item.href !== "/owner/registration-status") || (!isUnverifiedOwner && item.href === "/owner/registration-status")) {
      return false
    }

    return item.permissions.some(hasPermission)
  })

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-2">
        <Link className="flex h-10 items-center gap-2 rounded-md px-2" to="/dashboard">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <MapPinnedIcon className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            Quan4 Tourism
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {permittedNavigation.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {permittedNavigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link to={item.href} />}
                      isActive={location.pathname === item.href}
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                {user?.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-medium">{user?.fullName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user?.role?.name ?? "Chưa có vai trò"}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => void handleLogout()}>
              <LogOutIcon aria-hidden="true" />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
