import { useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  HeadphonesIcon,
  RefreshCwIcon,
  SearchIcon,
  TrophyIcon,
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
import { getApiErrorMessage } from "#lib/api";
import {
  dashboardStatisticsService,
  type AudioStatistics,
} from "../../../services/DashboardStatisticsService";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const AUDIO_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Lỗi",
};

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  icon: typeof HeadphonesIcon;
  loading?: boolean;
};

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  loading,
}: SummaryCardProps) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
          )}
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

export default function AudioStatisticsPage() {
  const [data, setData] = useState<AudioStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatistics() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await dashboardStatisticsService.getAudioStatistics(
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error("Invalid response");
        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải thống kê lượt nghe audio."),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadStatistics();
    return () => controller.abort();
  }, [requestVersion]);

  const topPois = useMemo(
    () => data?.pois.filter((poi) => poi.audio_listen_count > 0).slice(0, 10) ?? [],
    [data?.pois],
  );
  const maxListens = Math.max(topPois[0]?.audio_listen_count ?? 0, 1);
  const filteredPois = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return data?.pois ?? [];
    return (data?.pois ?? []).filter(
      (poi) =>
        poi.name.toLocaleLowerCase("vi").includes(keyword) ||
        poi.category_name.toLocaleLowerCase("vi").includes(keyword),
    );
  }, [data?.pois, search]);
  const mostListenedPoi = topPois[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Phân tích nội dung</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Thống kê lượt nghe audio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi mức độ tương tác với phần thuyết minh tại từng POI.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => setRequestVersion((value) => value + 1)}
        >
          <RefreshCwIcon className={loading ? "animate-spin" : ""} />
          Làm mới
        </Button>
      </header>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Không thể tải dữ liệu</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <section
        className="grid gap-4 sm:grid-cols-2"
        aria-label="Tổng hợp lượt nghe audio"
      >
        <SummaryCard
          label="Tổng lượt nghe"
          value={(data?.summary.total_listens ?? 0).toLocaleString("vi-VN")}
          description="Tổng số lần audio được phát trên toàn bộ POI."
          icon={HeadphonesIcon}
          loading={loading}
        />
        <SummaryCard
          label="Được nghe nhiều nhất"
          value={mostListenedPoi?.audio_listen_count.toLocaleString("vi-VN") ?? "0"}
          description={mostListenedPoi?.name ?? "Chưa có POI phát sinh lượt nghe."}
          icon={TrophyIcon}
          loading={loading}
        />
      </section>

      <section
        className="rounded-xl border bg-card p-5 shadow-sm"
        aria-labelledby="audio-ranking-title"
      >
        <h2 id="audio-ranking-title" className="font-semibold">
          Top POI theo lượt nghe
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          10 địa điểm có phần thuyết minh được nghe nhiều nhất.
        </p>

        {loading ? (
          <Skeleton className="mt-6 h-72 w-full" />
        ) : topPois.length ? (
          <div className="mt-6 space-y-4">
            {topPois.map((poi, index) => (
              <div key={poi.poi_id} className="grid gap-2 sm:grid-cols-[minmax(12rem,18rem)_1fr_5rem] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    <span className="mr-2 text-muted-foreground">#{index + 1}</span>
                    {poi.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {poi.category_name}
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{
                      width: `${Math.max(
                        (poi.audio_listen_count / maxListens) * 100,
                        2,
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-right text-sm font-semibold tabular-nums">
                  {poi.audio_listen_count.toLocaleString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Chưa có lượt nghe audio nào được ghi nhận.
          </p>
        )}
      </section>

      <section
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
        aria-labelledby="poi-audio-table-title"
      >
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="poi-audio-table-title" className="font-semibold">
              Chi tiết theo POI
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Danh sách được sắp xếp từ lượt nghe cao xuống thấp.
            </p>
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Tìm POI</span>
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên hoặc danh mục..."
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Hạng</TableHead>
                <TableHead>POI</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Trạng thái audio</TableHead>
                <TableHead className="text-right">Lượt nghe</TableHead>
                <TableHead>Lần nghe gần nhất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 6 }, (_, cell) => (
                      <TableCell key={cell}>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                filteredPois.map((poi) => {
                  const rank = (data?.pois.indexOf(poi) ?? -1) + 1;
                  return (
                    <TableRow key={poi.poi_id}>
                      <TableCell className="text-muted-foreground">
                        {rank > 0 ? `#${rank}` : "—"}
                      </TableCell>
                      <TableCell className="font-medium">{poi.name}</TableCell>
                      <TableCell>{poi.category_name}</TableCell>
                      <TableCell>
                        {AUDIO_STATUS_LABELS[poi.audio_status] ?? poi.audio_status}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {poi.audio_listen_count.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {poi.audio_listen_count > 0 && poi.last_listened_at
                          ? DATE_TIME_FORMATTER.format(new Date(poi.last_listened_at))
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}

              {!loading && !filteredPois.length && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {search ? "Không tìm thấy POI phù hợp." : "Chưa có dữ liệu POI."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
