import { AlertCircleIcon, BellIcon, CheckCheckIcon, InboxIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import { getApiErrorMessage } from "#lib/api";
import { ownerNotificationService } from "../../../services/OwnerNotificationService";
import type { OwnerNotification, OwnerNotificationPagination } from "../../../types/OwnerNotification";

const PAGE_SIZES = [20, 30, 50];
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function target(notification: OwnerNotification) {
  if (notification.resource_type === "poi_owner_registration") return "/quan-ly/dang-ky-chu-quan";
  if (notification.resource_type === "poi_submission") return "/quan-ly/chuc-nang-chu-quan/don-dang-ky-poi";
  return "/quan-ly/chuc-nang-chu-quan/poi-cua-toi";
}

export default function OwnerNotificationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = positiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const [data, setData] = useState<OwnerNotificationPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await ownerNotificationService.list(page, pageSize, controller.signal);
        if (!response.success || !response.data) throw new Error(response.message);
        if (!controller.signal.aborted) setData(response.data);
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError, "Không thể tải thông báo."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, pageSize, requestVersion]);

  function updatePage(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    params.set("page_size", String(nextPageSize));
    setSearchParams(params);
  }

  async function openNotification(notification: OwnerNotification) {
    if (!notification.is_read) await ownerNotificationService.markRead(notification.id);
    navigate(target(notification));
  }

  async function markAllRead() {
    try {
      await ownerNotificationService.markAllRead();
      setData((current) => current ? {
        ...current,
        data: current.data.map((item) => ({ ...item, is_read: true })),
      } : current);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Không thể cập nhật thông báo."));
    }
  }

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((item) => !item.is_read);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tài khoản</p>
          <div className="mt-1 flex items-center gap-3">
            <BellIcon className="size-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">Thông báo</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Theo dõi kết quả đăng ký và tiến trình xử lý POI.</p>
        </div>
        <div className="flex gap-2">
          {hasUnread && (
            <Button type="button" variant="outline" onClick={() => void markAllRead()}>
              <CheckCheckIcon aria-hidden="true" />
              Đánh dấu đã đọc
            </Button>
          )}
          <Button type="button" variant="outline" disabled={loading} onClick={() => setRequestVersion((value) => value + 1)}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            Làm mới
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải thông báo</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 w-full" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <InboxIcon className="size-9" aria-hidden="true" />
            <p className="font-medium text-foreground">Chưa có thông báo</p>
            <p className="text-sm">Kết quả xử lý hồ sơ và POI sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`flex w-full items-start gap-3 p-4 text-left hover:bg-muted/60 ${notification.is_read ? "" : "bg-primary/5"}`}
                onClick={() => void openNotification(notification)}
              >
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.is_read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{notification.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{notification.message}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">{dateFormatter.format(new Date(notification.created_at))}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <DataPagination
          page={data?.page ?? page}
          pageSize={pageSize}
          totalItems={data?.total_item ?? 0}
          totalPages={data?.total_page ?? 0}
          itemLabel="thông báo"
          disabled={loading}
          onPageChange={(nextPage) => updatePage(nextPage)}
          onPageSizeChange={(nextSize) => updatePage(1, nextSize)}
        />
      </section>
    </div>
  );
}
