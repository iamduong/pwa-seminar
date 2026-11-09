import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  AudioLinesIcon,
  ImagesIcon,
  LanguagesIcon,
  MapPinIcon,
  RefreshCwIcon,
  StoreIcon,
} from "lucide-react";
import { Link, useParams } from "react-router";

import HybridMap from "#components/map/HybridMap";
import type { MapCoordinates } from "../../../components/map/lib/map-type";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import { getApiErrorMessage } from "#lib/api";
import { cn } from "#lib/utils";
import { poiService } from "../../../services/PoiService";
import type { OwnerPoiDetail, OwnerPoiLanguage } from "../../../types/Poi";
import { AdminPoiMenuSection } from "../poi/AdminPoiMenuSection";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Thất bại",
  queued: "Đang chờ",
  running: "Đang chạy",
  done: "Hoàn tất",
  active: "Đang hoạt động",
  inactive: "Chưa hoạt động",
};

const LANGUAGE_NAMES = new Intl.DisplayNames(["vi-VN"], { type: "language" });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "medium",
});

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME_FORMATTER.format(date);
}

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function statusClassName(status: string) {
  if (status === "ready" || status === "done" || status === "active") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300";
  }
  if (status === "failed") {
    return "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300";
  }
  if (status === "processing" || status === "running") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-400/10 dark:text-blue-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium",
        statusClassName(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd>
    </div>
  );
}

function getCoordinates(poi: OwnerPoiDetail): MapCoordinates | null {
  const [longitude, latitude] = poi.location.coordinates;
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }
  return [longitude, latitude];
}

function resolveMediaUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (apiBaseUrl?.startsWith("http")) return new URL(url, apiBaseUrl).toString();
  return url;
}

function LanguageCard({ localization }: { localization: OwnerPoiLanguage }) {
  return (
    <article className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">
            {LANGUAGE_NAMES.of(localization.lang) ?? localization.lang}
          </p>
          <p className="text-xs text-muted-foreground">{localization.lang}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Bản dịch</span>
          <StatusBadge status={localization.translation_status} />
          <span className="ml-2 text-xs text-muted-foreground">Audio</span>
          <StatusBadge status={localization.audio_status} />
        </div>
      </header>

      {localization.error_message && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Xử lý ngôn ngữ thất bại</AlertTitle>
          <AlertDescription>{localization.error_message}</AlertDescription>
        </Alert>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <Detail label="Tên địa điểm" value={localization.name ?? "Chưa có bản dịch"} />
        <Detail label="Danh mục" value={localization.category ?? "Chưa có bản dịch"} />
        <div className="sm:col-span-2">
          <Detail label="Mô tả" value={localization.description ?? "Chưa có bản dịch"} />
        </div>
        <Detail label="Cập nhật" value={formatDateTime(localization.updated_at)} />
      </dl>

      <div className="border-t pt-4">
        {localization.audio_url ? (
          <audio
            className="w-full"
            controls
            preload="metadata"
            src={resolveMediaUrl(localization.audio_url)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Chưa có file audio cho ngôn ngữ này.</p>
        )}
      </div>
    </article>
  );
}

export default function OwnerPoiDetailPage({
  mode = "owner",
}: {
  mode?: "owner" | "admin";
}) {
  const { id = "" } = useParams();
  const listPath = mode === "admin"
    ? "/quan-ly/dia-diem-poi/danh-sach-poi"
    : "/quan-ly/chuc-nang-chu-quan/poi-cua-toi";
  const [poi, setPoi] = useState<OwnerPoiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPoi() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = mode === "admin"
          ? await poiService.getAdminPoiDetail(id, controller.signal)
          : await poiService.getMyPoiDetail(id, controller.signal);
        if (!response.success || !response.data) throw new Error("Invalid response");
        setPoi(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setPoi(null);
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải thông tin chi tiết POI."),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPoi();
    return () => controller.abort();
  }, [id, mode, requestVersion]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-112 w-full" />
          <Skeleton className="h-112 w-full" />
        </div>
      </div>
    );
  }

  if (!poi) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" render={<Link to={listPath} />}>
          <ArrowLeftIcon aria-hidden="true" />
          Quay lại danh sách
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể hiển thị POI</AlertTitle>
          <AlertDescription>
            <p>{errorMessage ?? "Không tìm thấy POI."}</p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => setRequestVersion((value) => value + 1)}
            >
              <RefreshCwIcon aria-hidden="true" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const coordinates = getCoordinates(poi);

  return (
    <div className="space-y-6">
      <header>
        <Button variant="ghost" render={<Link to={listPath} />} className="mb-3">
          <ArrowLeftIcon aria-hidden="true" />
          Quay lại danh sách
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {mode === "admin" ? "Chi tiết POI hệ thống" : "Chi tiết POI của tôi"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{poi.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Mã POI: {poi.id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">POI</span>
            <StatusBadge status={poi.is_active ? "active" : "inactive"} />
            <span className="ml-2 text-xs text-muted-foreground">Audio tổng</span>
            <StatusBadge status={poi.audio_status} />
          </div>
        </div>
      </header>

      {poi.latest_task && (
        <section className="space-y-3 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Tiến trình xử lý gần nhất</h2>
              <p className="mt-1 text-xs text-muted-foreground">Task: {poi.latest_task.id}</p>
            </div>
            <StatusBadge status={poi.latest_task.status} />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.min(100, Math.max(0, poi.latest_task.progress_percent))}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <span>{poi.latest_task.progress_percent}% hoàn tất</span>
            <span>
              Ngôn ngữ đang xử lý: {poi.latest_task.step_language ?? "Không có"}
            </span>
            <span>
              Retry: {poi.latest_task.retry_count}/{poi.latest_task.max_retries}
            </span>
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.85fr)_minmax(30rem,1.15fr)]">
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <StoreIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Thông tin POI</h2>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Tên địa điểm" value={poi.name} />
            <Detail label="Danh mục" value={poi.category_name} />
            <Detail label="Bán kính kích hoạt" value={`${poi.trigger_radius} m`} />
            <Detail label="Độ ưu tiên audio" value={String(poi.audio_priority)} />
            <Detail label="Trạng thái hoạt động" value={poi.is_active ? "Đang hoạt động" : "Chưa hoạt động"} />
            <Detail label="Yêu cầu kích hoạt" value={poi.activation_requested ? "Có" : "Không"} />
            <div className="sm:col-span-2"><Detail label="Địa chỉ" value={poi.address} /></div>
            <div className="sm:col-span-2"><Detail label="Mô tả gốc" value={poi.description} /></div>
            <Detail label="Ngày tạo" value={formatDateTime(poi.created_at)} />
            <Detail label="Cập nhật gần nhất" value={formatDateTime(poi.updated_at)} />
          </dl>

          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center gap-2">
              <ImagesIcon className="size-4" aria-hidden="true" />
              <h3 className="text-sm font-medium">Hình ảnh địa điểm</h3>
            </div>
            {poi.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {poi.images.map((image, index) => (
                  <img
                    key={`${image}:${index}`}
                    src={image}
                    alt={`${poi.name} - ảnh ${index + 1}`}
                    className="h-28 w-full rounded-lg border bg-muted object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không có hình ảnh.</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPinIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Vị trí và bán kính kích hoạt</h2>
          </div>
          {coordinates ? (
            <HybridMap
              className="h-128"
              initialCenter={coordinates}
              initialZoom={16}
              selectedLocation={{
                location: coordinates,
                radius: poi.trigger_radius,
              }}
            />
          ) : (
            <Alert variant="destructive">
              <AlertCircleIcon aria-hidden="true" />
              <AlertTitle>Không thể hiển thị bản đồ</AlertTitle>
              <AlertDescription>Dữ liệu tọa độ không hợp lệ.</AlertDescription>
            </Alert>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <LanguagesIcon className="size-5" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Bản dịch và audio theo ngôn ngữ</h2>
          <span className="text-sm text-muted-foreground">({poi.localizations.length})</span>
        </div>
        {poi.localizations.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {poi.localizations.map((localization) => (
              <LanguageCard key={localization.lang} localization={localization} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border bg-card text-center text-muted-foreground">
            <AudioLinesIcon className="size-7" aria-hidden="true" />
            <p>POI chưa có bản dịch hoặc audio.</p>
          </div>
        )}
      </section>

      {mode === "admin" && <AdminPoiMenuSection poiId={poi.id} />}
    </div>
  );
}
