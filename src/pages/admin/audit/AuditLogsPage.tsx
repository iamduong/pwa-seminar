import { AlertCircleIcon, FileClockIcon, InboxIcon, RefreshCwIcon, SearchIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Skeleton } from "#components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";
import { getApiErrorMessage } from "#lib/api";
import { auditLogService } from "../../../services/AuditLogService";
import type { AuditLogPagination } from "../../../types/AuditLog";

const PAGE_SIZES = [20, 30, 50];
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" });

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default function AuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = positiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const action = searchParams.get("action") ?? "";
  const resourceType = searchParams.get("resource_type") ?? "";
  const actorUserId = searchParams.get("actor_user_id") ?? "";
  const [data, setData] = useState<AuditLogPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await auditLogService.list(
          { page, pageSize, action, resourceType, actorUserId },
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error(response.message);
        if (!controller.signal.aborted) setData(response.data);
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError, "Không thể tải nhật ký hệ thống."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, pageSize, action, resourceType, actorUserId, requestVersion]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("page_size", String(pageSize));
    for (const key of ["action", "resource_type", "actor_user_id"] as const) {
      const value = String(form.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    setSearchParams(params);
  }

  function updatePage(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    params.set("page_size", String(nextPageSize));
    setSearchParams(params);
  }

  const logs = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Giám sát hệ thống</p>
          <div className="mt-1 flex items-center gap-3">
            <FileClockIcon className="size-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">Nhật ký hệ thống</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Theo dõi các thao tác nghiệp vụ quan trọng trên hệ thống.</p>
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={() => setRequestVersion((value) => value + 1)}>
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
          Làm mới
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải nhật ký</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <form className="grid gap-3 border-b p-4 md:grid-cols-[1fr_1fr_1.3fr_auto]" onSubmit={applyFilters}>
          <Input name="action" defaultValue={action} placeholder="Hành động" aria-label="Lọc theo hành động" />
          <Input name="resource_type" defaultValue={resourceType} placeholder="Loại tài nguyên" aria-label="Lọc theo loại tài nguyên" />
          <Input name="actor_user_id" defaultValue={actorUserId} placeholder="ID người thực hiện" aria-label="Lọc theo người thực hiện" />
          <Button type="submit" disabled={loading}>
            <SearchIcon aria-hidden="true" />
            Lọc
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Thời gian</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Tài nguyên</TableHead>
              <TableHead>Kết quả</TableHead>
              <TableHead className="pr-4">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }, (_, row) => (
              <TableRow key={row}>{Array.from({ length: 6 }, (_, cell) => <TableCell key={cell}><Skeleton className="h-6 min-w-24" /></TableCell>)}</TableRow>
            ))}
            {!loading && logs.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="size-8" aria-hidden="true" />
                    <p className="font-medium text-foreground">Chưa có nhật ký phù hợp</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="pl-4 whitespace-nowrap text-xs">{dateFormatter.format(new Date(log.created_at))}</TableCell>
                <TableCell><code className="text-xs">{log.action}</code></TableCell>
                <TableCell className="max-w-40 truncate font-mono text-xs">{log.actor_user_id ?? "Hệ thống"}</TableCell>
                <TableCell>
                  <p className="text-sm">{log.resource_type}</p>
                  <p className="max-w-44 truncate font-mono text-xs text-muted-foreground">{log.resource_id ?? "—"}</p>
                </TableCell>
                <TableCell>{log.result === "success" ? "Thành công" : log.result}</TableCell>
                <TableCell className="pr-4">
                  <details className="max-w-80 text-sm">
                    <summary className="cursor-pointer text-primary">Xem</summary>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{log.description || "Không có mô tả."}</p>
                    {Object.keys(log.metadata).length > 0 && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                    )}
                  </details>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <DataPagination
          page={data?.page ?? page}
          pageSize={pageSize}
          totalItems={data?.total_item ?? 0}
          totalPages={data?.total_page ?? 0}
          itemLabel="nhật ký"
          disabled={loading}
          onPageChange={(nextPage) => updatePage(nextPage)}
          onPageSizeChange={(nextSize) => updatePage(1, nextSize)}
        />
      </section>
    </div>
  );
}
