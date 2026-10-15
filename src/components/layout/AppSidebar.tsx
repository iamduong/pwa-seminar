import { useState } from "react";
import {
  BarChart3Icon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  FileClockIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinnedIcon,
  SettingsIcon,
  ShieldCheckIcon,
  StoreIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "#components/ui/sidebar";
import { useAuth } from "#hooks/use-auth";

const navigationGroup = [
  {
    title: "Tổng quan",
    icon: LayoutDashboardIcon,
    child: [
      {
        title: "Bảng điều khiển",
        href: "/dashboard",
        permissions: ["analytics:view", "analytics:view_own"],
      },
    ],
  },
  {
    title: "Địa điểm",
    icon: MapPinnedIcon,
    child: [
      {
        title: "Danh sách POI",
        href: "/quan-ly/danh-sach-poi",
        permissions: ["poi:read", "poi:update", "poi:delete", "poi:toogle"],
      },
      {
        title: "Thêm POI",
        href: "/quan-ly/them-poi",
        permissions: ["poi:create"],
      },
      {
        title: "Duyệt đơn POI",
        href: "/quan-ly/duyet-don-poi",
        permissions: ["poi:approve"],
      },
    ],
  },
  {
    title: "Thực đơn",
    icon: UtensilsIcon,
    child: [
      {
        title: "Danh sách thực đơn",
        href: "/quan-ly/danh-sach-thuc-don",
        permissions: ["menu:read", "menu:update", "menu:delete"],
      },
      {
        title: "Thêm thực đơn",
        href: "/quan-ly/them-thuc-don",
        permissions: ["menu:create"],
      },
    ],
  },
  {
    title: "Người dùng",
    icon: UsersIcon,
    child: [
      {
        title: "Danh sách người dùng",
        href: "/quan-ly/danh-sach-nguoi-dung",
        permissions: ["user:read", "user:update", "user:delete"],
      },
      {
        title: "Thêm người dùng",
        href: "/quan-ly/them-nguoi-dung",
        permissions: ["user:create"],
      },
    ],
  },
  {
    title: "Vai trò",
    icon: ShieldCheckIcon,
    child: [
      {
        title: "Danh sách vai trò",
        href: "/quan-ly/danh-sach-vai-tro",
        permissions: ["role:read", "role:update", "role:delete"],
      },
      {
        title: "Thêm vai trò",
        href: "/quan-ly/them-vai-tro",
        permissions: ["role:create"],
      },
    ],
  },
  {
    title: "Thống kê",
    icon: BarChart3Icon,
    child: [
      {
        title: "Tổng quan thống kê",
        href: "/quan-ly/thong-ke",
        permissions: ["analytics:view"],
      },
      {
        title: "Thống kê của tôi",
        href: "/quan-ly/thong-ke-cua-toi",
        permissions: ["analytics:view_own"],
      },
      {
        title: "Xuất báo cáo",
        href: "/quan-ly/xuat-bao-cao",
        permissions: ["analytics:export"],
      },
    ],
  },
  {
    title: "Nhật ký",
    icon: FileClockIcon,
    child: [
      {
        title: "Nhật ký hoạt động",
        href: "/quan-ly/nhat-ky-hoat-dong",
        permissions: ["audit:read"],
      },
      {
        title: "Quản lý nhật ký",
        href: "/quan-ly/quan-ly-nhat-ky",
        permissions: ["audit:manage"],
      },
    ],
  },
  {
    title: "Hệ thống",
    icon: SettingsIcon,
    child: [
      {
        title: "Cấu hình hệ thống",
        href: "/quan-ly/cau-hinh-he-thong",
        permissions: ["system:config"],
      },
      {
        title: "Nhật ký hệ thống",
        href: "/quan-ly/nhat-ky-he-thong",
        permissions: ["system:log"],
      },
      {
        title: "Sao lưu dữ liệu",
        href: "/quan-ly/sao-luu-du-lieu",
        permissions: ["system:backup"],
      },
    ],
  },
  {
    title: "Chủ địa điểm",
    icon: StoreIcon,
    child: [
      {
        title: "Gửi yêu cầu thêm POI",
        href: "/quan-ly/gui-yeu-cau-poi",
        permissions: ["owner:submit_poi"],
      },
      {
        title: "POI của tôi",
        href: "/quan-ly/poi-cua-toi",
        permissions: ["owner:manage_own_poi"],
      },
    ],
  },
  {
    title: "Nội dung",
    icon: ClipboardCheckIcon,
    child: [
      {
        title: "Kiểm duyệt nội dung",
        href: "/quan-ly/kiem-duyet-noi-dung",
        permissions: ["content:moderate"],
      },
      {
        title: "Xuất bản nội dung",
        href: "/quan-ly/xuat-ban-noi-dung",
        permissions: ["content:publish"],
      },
    ],
  },
];

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, logout, user } = useAuth();
  const [openedGroups, setOpenedGroups] = useState<string[]>(() =>
    navigationGroup
      .filter((group) =>
        group.child.some((item) => isCurrentPath(location.pathname, item.href)),
      )
      .map((group) => group.title),
  );

  const permittedNavigation = navigationGroup
    .map((group) => ({
      ...group,
      child: group.child.filter((item) => {
        if (!item.permissions.some(hasPermission)) return false
        if (group.title !== "Chủ địa điểm") return true

        if (user?.role?.name === "poi_owner" && user.isPoiOwnerVerified) {
          return (
            item.href === "/quan-ly/gui-yeu-cau-poi" ||
            item.href === "/quan-ly/poi-cua-toi"
          )
        }

        return false
      }),
    }))
    .filter((group) => group.child.length > 0);

  function toggleGroup(title: string) {
    setOpenedGroups((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-2">
        <Link
          className="flex h-10 items-center gap-2 rounded-md px-2"
          to="/dashboard"
        >
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
                {permittedNavigation.map((group) => {
                  const isOpen = openedGroups.includes(group.title);

                  return (
                    <SidebarMenuItem key={group.title}>
                      <SidebarMenuButton
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => toggleGroup(group.title)}
                      >
                        <group.icon aria-hidden="true" />
                        <span>{group.title}</span>
                        <ChevronDownIcon
                          className={`ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </SidebarMenuButton>

                      {isOpen && (
                        <SidebarMenuSub>
                          {group.child.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                render={<Link to={item.href} />}
                                isActive={isCurrentPath(
                                  location.pathname,
                                  item.href,
                                )}
                                className="data-active:bg-neutral-200 data-active:font-medium data-active:text-neutral-950 data-active:hover:bg-neutral-200 data-active:hover:text-neutral-950 dark:data-active:bg-neutral-800 dark:data-active:text-neutral-50 dark:data-active:hover:bg-neutral-800 dark:data-active:hover:text-neutral-50"
                                aria-current={
                                  isCurrentPath(location.pathname, item.href)
                                    ? "page"
                                    : undefined
                                }
                              >
                                <span>{item.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
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
                <span className="block truncate text-sm font-medium">
                  {user?.fullName}
                </span>
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
  );
}
