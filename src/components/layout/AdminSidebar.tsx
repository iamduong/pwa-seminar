import { useState } from "react";
import {
  ChevronDownIcon,
  ClipboardCheckIcon,
  FileClockIcon,
  LogOutIcon,
  MapPinnedIcon,
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
import { useAuthorize } from "../../hooks/use-authorize";
import { authorizeService } from "../../services/AuthorizeService";

const navigationGroup = [
  {
    title: "Địa điểm POI",
    icon: MapPinnedIcon,
    child: [
      {
        title: "Danh sách POI",
        href: "/quan-ly/dia-diem-poi/danh-sach-poi",
        permissions: ["poi:read"],
      },
      {
        title: "Thêm POI",
        href: "/quan-ly/dia-diem-poi/them-poi",
        permissions: ["poi:create"],
      },
    ],
  },
  {
    title: "Ẩm thực",
    icon: UtensilsIcon,
    child: [
      {
        title: "Danh sách thực đơn",
        href: "/quan-ly/danh-sach-thuc-don",
        // menu:update, menu:delete
        permissions: ["menu:read"],
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
        href: "/quan-ly/nguoi-dung/danh-sach-nguoi-dung",
        permissions: ["user:read"],
      },
      {
        title: "Thêm người dùng",
        href: "/quan-ly/nguoi-dung/them-nguoi-dung",
        permissions: ["user:create"],
      },
    ],
  },
  {
    title: "Quyền hạn",
    icon: ShieldCheckIcon,
    child: [
      {
        title: "Danh sách vai trò",
        href: "/quan-ly/quyen-han/danh-sach-vai-tro",
        permissions: ["role:read"],
      },
      {
        title: "Thêm vai trò",
        href: "/quan-ly/quyen-han/them-vai-tro",
        permissions: ["role:create"],
      },
    ],
  },
  {
    title: "Chức năng chủ quán",
    icon: StoreIcon,
    child: [
      {
        title: "POI của tôi",
        href: "/quan-ly/chuc-nang-chu-quan/poi-cua-toi",
        permissions: ["owner:poi_read"],
      },
      {
        title: "Gửi yêu cầu thêm POI",
        href: "/quan-ly/chuc-nang-chu-quan/gui-yeu-cau-them-poi",
        permissions: ["owner:poi_submit"],
      },
      {
        title: "Đơn đăng ký POI",
        href: "/quan-ly/chuc-nang-chu-quan/don-dang-ky-poi",
        permissions: ["owner:poi_read"],
      },
      // !NOT IMPLEMENT
      {
        title: "Thực đơn của tôi",
        href: "/quan-ly/chuc-nang-chu-quan/thuc-don-cua-toi",
        permissions: ["owner:menu_read"],
      },
      {
        title: "Gửi yêu cầu thực đơn",
        href: "/quan-ly/chuc-nang-chu-quan/gui-yeu-cau-thuc-don",
        permissions: ["owner:menu_submit"],
      },
    ],
  },
  {
    title: "Đơn đăng ký chủ quán",
    icon: ClipboardCheckIcon,
    child: [
      {
        title: "Danh sách đơn đăng ký",
        href: "/quan-ly/don-dang-ky-chu-quan/danh-sach-don-dang-ky",
        permissions: ["owner_registration:read"],
      },
    ],
  },
  {
    title: "Đơn đăng ký POI",
    icon: FileClockIcon,
    child: [
      {
        title: "Danh sách đơn POI",
        href: "/quan-ly/don-dang-ky-poi/danh-sach-don-poi",
        permissions: ["poi_submission:read"],
      },
      {
        title: "Duyệt đơn POI",
        href: "/quan-ly/don-dang-ky-poi/duyet-don-poi",
        permissions: ["poi_submission:review"],
      },
      {
        title: "Xem tiến trình",
        href: "/quan-ly/don-dang-ky-poi/xem-tien-trinh",
        permissions: ["poi_submission:monitor"],
      },
    ],
  },
];

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { session, clearSession } = useAuthorize();

  const permittedNavigation = navigationGroup
    .map((group) => ({
      ...group,
      child: group.child.filter((item) =>
        item.permissions.some((permission) =>
          session?.role?.permissions.includes(permission),
        ),
      ),
    }))
    .filter((group) => group.child.length > 0);

  const [openedGroups, setOpenedGroups] = useState<string[]>(() =>
    navigationGroup
      .filter((group) =>
        group.child.some((item) => isCurrentPath(location.pathname, item.href)),
      )
      .map((group) => group.title),
  );

  function toggleGroup(title: string) {
    setOpenedGroups((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
  }

  async function handleLogout() {
    try {
      await authorizeService.Logout();
    } finally {
      clearSession();
      navigate("/quan-ly/dang-nhap", { replace: true });
    }
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
                {session?.fullName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm font-medium">
                  {session?.fullName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {session?.role?.name ?? "Chưa có vai trò"}
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
