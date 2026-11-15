import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  BarChart3Icon,
  Clock3Icon,
  RadioIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/ui/table";
import { usePresenceSocket } from "#hooks/use-presence-socket";
import { getApiErrorMessage } from "#lib/api";
import {
  dashboardStatisticsService,
  type ConnectionStatistics,
} from "../../../services/DashboardStatisticsService";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initialDateRange() {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo);
  dateFrom.setDate(dateFrom.getDate() - 6);
  return { dateFrom: formatDateInput(dateFrom), dateTo: formatDateInput(dateTo) };
}

const DEFAULT_RANGE = initialDateRange();
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "medium",
});

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} phút`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours} giờ ${minutes} phút`;
}

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  icon: typeof RadioIcon;
  loading?: boolean;
};

function SummaryCard({ label, value, description, icon: Icon, loading }: SummaryCardProps) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? <Skeleton className="mt-3 h-9 w-20" /> : <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>}
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{description}</p>
    </article>
  );
}

export default function ConnectionStatisticsPage() {
  const { connectedVisitors, isConnected } = usePresenceSocket("dashboard");
  const [draftDateFrom, setDraftDateFrom] = useState(DEFAULT_RANGE.dateFrom);
  const [draftDateTo, setDraftDateTo] = useState(DEFAULT_RANGE.dateTo);
  const [dateFrom, setDateFrom] = useState(DEFAULT_RANGE.dateFrom);
  const [dateTo, setDateTo] = useState(DEFAULT_RANGE.dateTo);
  const [data, setData] = useState<ConnectionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadStatistics() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await dashboardStatisticsService.getConnectionStatistics(
          { dateFrom, dateTo },
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error("Invalid response");
        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(getApiErrorMessage(error, "Không thể tải thống kê lượt kết nối."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadStatistics();
    return () => controller.abort();
  }, [dateFrom, dateTo, requestVersion]);

  const maxConnections = useMemo(
    () => Math.max(...(data?.daily.map((item) => item.connections) ?? []), 1),
    [data?.daily],
  );

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftDateFrom > draftDateTo) {
      setFilterError("Ngày bắt đầu không được sau ngày kết thúc.");
      return;
    }
    setFilterError(null);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setRequestVersion((value) => value + 1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Phân tích truy cập</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Thống kê lượt kết nối</h1>
          <p className="mt-2 text-sm text-muted-foreground">Theo dõi xu hướng truy cập và các phiên kết nối gần đây.</p>
        </div>
        <form className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end" onSubmit={applyFilter}>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Từ ngày</span>
            <input className="h-9 rounded-md border bg-background px-3" type="date" value={draftDateFrom} max={draftDateTo} onChange={(event) => setDraftDateFrom(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Đến ngày</span>
            <input className="h-9 rounded-md border bg-background px-3" type="date" value={draftDateTo} min={draftDateFrom} onChange={(event) => setDraftDateTo(event.target.value)} />
          </label>
          <Button type="submit" disabled={loading}>Áp dụng</Button>
        </form>
      </header>

      {filterError && <Alert variant="destructive"><AlertCircleIcon /><AlertDescription>{filterError}</AlertDescription></Alert>}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Không thể tải dữ liệu</AlertTitle>
          <AlertDescription>
            {errorMessage}
            <Button className="mt-3" type="button" size="sm" variant="outline" onClick={() => setRequestVersion((value) => value + 1)}>
              <RefreshCwIcon /> Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng hợp lượt kết nối">
        <SummaryCard label="Đang kết nối" value={connectedVisitors?.toLocaleString("vi-VN") ?? "—"} description={isConnected ? "Số khách đang kết nối theo thời gian thực." : "Đang kết nối tới máy chủ…"} icon={RadioIcon} />
        <SummaryCard label="Tổng lượt kết nối" value={(data?.summary.total_connections ?? 0).toLocaleString("vi-VN")} description="Số lượt kết nối trong khoảng ngày đã chọn." icon={BarChart3Icon} loading={loading} />
        <SummaryCard label="Khách duy nhất" value={(data?.summary.unique_visitors ?? 0).toLocaleString("vi-VN")} description="Số trình duyệt khác nhau trong khoảng ngày." icon={UsersIcon} loading={loading} />
        <SummaryCard label="Thời lượng trung bình" value={formatDuration(data?.summary.average_duration_seconds ?? 0)} description="Thời gian trung bình của các kết nối đã kết thúc." icon={Clock3Icon} loading={loading} />
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm" aria-labelledby="connection-chart-title">
        <div>
          <h2 id="connection-chart-title" className="font-semibold">Lượt kết nối theo ngày</h2>
          <p className="mt-1 text-sm text-muted-foreground">So sánh tổng lượt kết nối và khách duy nhất từng ngày.</p>
        </div>
        {loading ? (
          <Skeleton className="mt-6 h-64 w-full" />
        ) : data?.daily.length ? (
          <div className="mt-6 overflow-x-auto pb-2">
            <div className="grid h-64 min-w-160 auto-cols-fr grid-flow-col items-end gap-3 border-b px-2">
              {data.daily.map((item) => (
                <div key={item.date} className="flex h-full min-w-12 flex-col justify-end gap-2 text-center">
                  <span className="text-xs font-medium tabular-nums">{item.connections}</span>
                  <div className="mx-auto w-full max-w-10 rounded-t-md bg-primary" style={{ height: `${Math.max(item.connections / maxConnections * 100, 4)}%` }} title={`${item.connections} lượt, ${item.unique_visitors} khách`} />
                  <span className="pb-2 text-[11px] text-muted-foreground">{new Date(`${item.date}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-muted/30 p-8 text-center text-sm text-muted-foreground">Không có lượt kết nối trong khoảng ngày này.</p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="recent-connections-title">
        <div className="border-b p-5">
          <h2 id="recent-connections-title" className="font-semibold">Lượt kết nối gần đây</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tối đa 50 lượt mới nhất trong khoảng ngày đã chọn.</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Thời điểm</TableHead><TableHead>Visitor ID</TableHead><TableHead>Thời lượng</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }, (_, index) => <TableRow key={index}>{Array.from({ length: 4 }, (_, cell) => <TableCell key={cell}><Skeleton className="h-6 w-24" /></TableCell>)}</TableRow>)}
              {!loading && data?.recent_connections.map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell>{DATE_TIME_FORMATTER.format(new Date(connection.connected_at))}</TableCell>
                  <TableCell className="font-mono text-xs">{connection.session_id.slice(0, 8)}…</TableCell>
                  <TableCell>{connection.disconnected_at ? formatDuration(connection.duration_seconds) : "—"}</TableCell>
                  <TableCell><span className={connection.disconnected_at ? "text-muted-foreground" : "font-medium text-emerald-600"}>{connection.disconnected_at ? "Đã ngắt" : "Đang kết nối"}</span></TableCell>
                </TableRow>
              ))}
              {!loading && !data?.recent_connections.length && <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Chưa có dữ liệu kết nối.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
