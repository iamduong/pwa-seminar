import { useEffect, useState, type ComponentType } from "react";
import {
  AlertCircleIcon,
  ActivityIcon,
  BarChart3Icon,
  Building2Icon,
  ClipboardClockIcon,
  MapPinnedIcon,
  RadioIcon,
  RefreshCwIcon,
  StoreIcon,
  UsersIcon,
  UtensilsIcon,
} from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button, buttonVariants } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import { useAuthorize } from "#hooks/use-authorize";
import { usePresenceSocket } from "#hooks/use-presence-socket";
import { getApiErrorMessage } from "#lib/api";
import { adminUserService } from "../../../services/AdminUserService";
import { dashboardStatisticsService } from "../../../services/DashboardStatisticsService";
import { menuItemService } from "../../../services/MenuItemService";
import { poiOwnerRegistrationService } from "../../../services/PoiOwnerRegistrationService";
import { poiService } from "../../../services/PoiService";
import { poiSubmissionService } from "../../../services/PoiSubmissionService";

type DashboardMetrics = {
  pois?: number;
  menuItems?: number;
  pendingPoiSubmissions?: number;
  pendingOwnerRegistrations?: number;
  runningPoiTasks?: number;
  users?: number;
};

const EMPTY_PERMISSIONS: string[] = [];

type MetricCardProps = {
  label: string;
  value: number | undefined;
  description: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
  loading: boolean;
};

type DashboardCard = Omit<MetricCardProps, "loading"> & {
  group: "overview" | "operations";
  realtime?: boolean;
};

function MetricCard({ label, value, description, icon: Icon, loading }: MetricCardProps) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-16" />
          ) : (
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
              {value?.toLocaleString("vi-VN") ?? "—"}
            </p>
          )}
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{description}</p>
    </article>
  );
}

export default function DashboardPage() {
  const { session } = useAuthorize();
  const {
    connectedVisitors,
    totalConnections,
    isConnected: isPresenceConnected,
  } = usePresenceSocket("dashboard");
  const permissions = session?.role?.permissions ?? EMPTY_PERMISSIONS;
  const isOwner = session?.role?.name === "poi_owner";
  const canViewSystemStatistics =
    !isOwner
    && permissions.includes("poi:read")
    && permissions.includes("poi_submission:monitor");
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setErrorMessage(null);
      setMetrics({});

      try {
        if (isOwner) {
          const [poisResponse, submissionsResponse, menuResponse] = await Promise.all([
            poiService.getMyPois({ page: 1, pageSize: 1 }),
            poiSubmissionService.GetMyPoiSubmissions({ page: 1, pageSize: 1, status: "pending" }),
            menuItemService.listMine(),
          ]);
          if (cancelled) return;
          setMetrics({
            pois: poisResponse.data?.total_item ?? 0,
            pendingPoiSubmissions: submissionsResponse.data?.total_item ?? 0,
            menuItems: menuResponse.data?.length ?? 0,
          });
          return;
        }

        const nextMetrics: DashboardMetrics = {};
        const requests: Promise<void>[] = [];

        if (canViewSystemStatistics) {
          requests.push(
            dashboardStatisticsService.getStatistics().then((response) => {
              nextMetrics.pois = response.data?.total_pois ?? 0;
              nextMetrics.runningPoiTasks = response.data?.running_poi_tasks ?? 0;
            }),
          );
        } else if (permissions.includes("poi:read")) {
          requests.push(
            poiService.getAdminPois({ page: 1, pageSize: 1 }).then((response) => {
              nextMetrics.pois = response.data?.total_item ?? 0;
            }),
          );
        }
        if (permissions.includes("poi_submission:read")) {
          requests.push(
            poiSubmissionService.GetPoiSubmissions({ page: 1, pageSize: 1, status: "pending" }).then((response) => {
              nextMetrics.pendingPoiSubmissions = response.data?.total_item ?? 0;
            }),
          );
        }
        if (permissions.includes("owner_registration:read")) {
          requests.push(
            poiOwnerRegistrationService.PaginationPoiOwnerRegistration({ page: 1, pageSize: 1, status: "pending" }).then((response) => {
              nextMetrics.pendingOwnerRegistrations = response.data?.total_item ?? 0;
            }),
          );
        }
        if (permissions.includes("user:read")) {
          requests.push(
            adminUserService.PaginationAdminUser({ page: 1, page_size: 1 }).then((response) => {
              nextMetrics.users = response.data?.total_item ?? 0;
            }),
          );
        }

        await Promise.all(requests);
        if (!cancelled) setMetrics(nextMetrics);
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorMessage(getApiErrorMessage(error, "Không thể tải dữ liệu tổng quan."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [canViewSystemStatistics, isOwner, permissions, requestVersion]);

  const cards: DashboardCard[] = isOwner
    ? [
        { label: "Khách đang kết nối", value: connectedVisitors, description: isPresenceConnected ? "Số khách du lịch đang sử dụng ứng dụng theo thời gian thực." : "Đang kết nối tới cổng theo dõi thời gian thực…", icon: RadioIcon, group: "overview", realtime: true },
        { label: "Tổng lượt truy cập", value: totalConnections, description: "Số lượt truy cập từ trước tới nay", icon: BarChart3Icon, group: "overview", realtime: true },
        { label: "POI của tôi", value: metrics.pois, description: "Địa điểm đang thuộc quyền quản lý của bạn.", icon: StoreIcon, group: "overview" },
        { label: "Món ăn", value: metrics.menuItems, description: "Tổng số món ăn đã gửi lên hệ thống.", icon: UtensilsIcon, group: "operations" },
        { label: "Đơn POI chờ duyệt", value: metrics.pendingPoiSubmissions, description: "Yêu cầu đang chờ quản trị viên xử lý.", icon: ClipboardClockIcon, group: "operations" },
      ]
    : [
        { label: "Khách đang kết nối", value: connectedVisitors, description: isPresenceConnected ? "Số khách du lịch đang sử dụng ứng dụng theo thời gian thực." : "Đang kết nối tới cổng theo dõi thời gian thực…", icon: RadioIcon, group: "overview", realtime: true },
        { label: "Tổng lượt kết nối", value: totalConnections, description: "Số lượt khách đã kết nối từ trước tới nay.", icon: BarChart3Icon, group: "overview", realtime: true },
        ...(permissions.includes("poi:read")
          ? [{ label: "Tổng POI", value: metrics.pois, description: "Số địa điểm hiện có trong hệ thống.", icon: MapPinnedIcon, group: "overview" as const }]
          : []),
        ...(permissions.includes("poi_submission:read")
          ? [{ label: "Đơn POI chờ duyệt", value: metrics.pendingPoiSubmissions, description: "Yêu cầu POI cần quản trị viên xử lý.", icon: ClipboardClockIcon, group: "operations" as const }]
          : []),
        ...(permissions.includes("poi_submission:monitor")
          ? [{ label: "POI task đang chạy", value: metrics.runningPoiTasks, description: "Số tiến trình xử lý POI đang chạy trên hệ thống.", icon: ActivityIcon, group: "operations" as const }]
          : []),
        ...(permissions.includes("owner_registration:read")
          ? [{ label: "Hồ sơ chủ quán", value: metrics.pendingOwnerRegistrations, description: "Hồ sơ đăng ký chủ quán đang chờ duyệt.", icon: Building2Icon, group: "operations" as const }]
          : []),
        ...(permissions.includes("user:read")
          ? [{ label: "Người dùng", value: metrics.users, description: "Tài khoản được quản lý trên hệ thống.", icon: UsersIcon, group: "operations" as const }]
          : []),
      ];

  const overviewCards = cards.filter((card) => card.group === "overview");
  const operationCards = cards.filter((card) => card.group === "operations");

  const primaryAction = isOwner
    ? { label: "Xem POI của tôi", href: "/quan-ly/chuc-nang-chu-quan/poi-cua-toi" }
    : { label: "Xem danh sách POI", href: "/quan-ly/dia-diem-poi/danh-sach-poi" };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{isOwner ? "Cổng chủ quán" : "Quản trị hệ thống"}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tổng quan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Xin chào {session?.fullName}. Theo dõi nhanh tình trạng vận hành và các công việc cần xử lý.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => setRequestVersion((value) => value + 1)}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            Làm mới
          </Button>
          <Link className={buttonVariants()} to={primaryAction.href}>{primaryAction.label}</Link>
        </div>
      </header>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải đầy đủ dữ liệu</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="overview-metrics-title">
        <div className="mb-4">
          <div>
            <h2 id="overview-metrics-title" className="text-lg font-semibold">Tổng quan truy cập</h2>
            <p className="mt-1 text-sm text-muted-foreground">Các chỉ số chính để đánh giá nhanh tình hình hệ thống.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {overviewCards.map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              description={card.description}
              icon={card.icon}
              loading={card.realtime ? false : loading}
            />
          ))}
        </div>
      </section>

      {operationCards.length > 0 && (
        <section aria-labelledby="operation-metrics-title">
          <div className="mb-4">
            <h2 id="operation-metrics-title" className="text-lg font-semibold">Vận hành hệ thống</h2>
            <p className="mt-1 text-sm text-muted-foreground">Các đầu việc và trạng thái cần theo dõi.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {operationCards.map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                description={card.description}
                icon={card.icon}
                loading={card.realtime ? false : loading}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="quick-actions-title">
        <div className="mb-4">
          <h2 id="quick-actions-title" className="text-lg font-semibold">Lối tắt</h2>
          <p className="mt-1 text-sm text-muted-foreground">Đi nhanh đến các công việc thường dùng.</p>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
            {isOwner ? (
              <>
                <Link className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50" to="/quan-ly/chuc-nang-chu-quan/gui-yeu-cau-them-poi">
                  <span>Gửi yêu cầu thêm POI</span><span aria-hidden="true">→</span>
                </Link>
                <Link className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50" to="/quan-ly/chuc-nang-chu-quan/gui-yeu-cau-thuc-don">
                  <span>Thêm món ăn</span><span aria-hidden="true">→</span>
                </Link>
              </>
            ) : (
              <>
                {permissions.includes("poi_submission:read") && <Link className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50" to="/quan-ly/don-dang-ky-poi/danh-sach-don-poi"><span>Xử lý đơn đăng ký POI</span><span aria-hidden="true">→</span></Link>}
                {permissions.includes("owner_registration:read") && <Link className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50" to="/quan-ly/don-dang-ky-chu-quan/danh-sach-don-dang-ky"><span>Xử lý hồ sơ chủ quán</span><span aria-hidden="true">→</span></Link>}
              </>
            )}
        </div>
      </section>
    </div>
  );
}
