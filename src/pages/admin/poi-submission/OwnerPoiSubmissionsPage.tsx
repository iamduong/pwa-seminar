import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FileClockIcon,
  InboxIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
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
import { useAuthorize } from "../../../providers/AuthorizeProvider";
import { poiSubmissionService } from "../../../services/PoiSubmissionService";
import type {
  PoiSubmissionPagination,
  PoiSubmissionStatus,
} from "../../../types/PoiSubmission";

const PAGE_SIZES = [20, 30, 50];

const STATUS_LABELS: Record<PoiSubmissionStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const STATUS_CLASSES: Record<PoiSubmissionStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300",
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStatus(value: string | null): PoiSubmissionStatus | undefined {
  return value === "pending" || value === "approved" || value === "rejected"
    ? value
    : undefined;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export default function OwnerPoiSubmissionsPage() {
  const { session } = useAuthorize();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = parsePositiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const query = searchParams.get("q")?.slice(0, 100) ?? "";
  const status = parseStatus(searchParams.get("status"));
  const createdSubmissionId = searchParams.get("created");

  const [queryDraft, setQueryDraft] = useState(query);
  const [statusDraft, setStatusDraft] = useState(status ?? "all");
  const [data, setData] = useState<PoiSubmissionPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSubmissions() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await poiSubmissionService.GetMyPoiSubmissions(
          { page, pageSize, q: query, status },
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error("Invalid response");
        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Không thể tải đơn đăng ký POI. Vui lòng thử lại.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSubmissions();
    return () => controller.abort();
  }, [page, pageSize, query, requestVersion, status]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    nextParams.set("page", "1");
    nextParams.set("page_size", String(pageSize));
    if (queryDraft.trim()) nextParams.set("q", queryDraft.trim());
    if (statusDraft !== "all") nextParams.set("status", statusDraft);
    setSearchParams(nextParams);
  }

  function updatePagination(nextPage: number, nextPageSize = pageSize) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("created");
    nextParams.set("page", String(nextPage));
    nextParams.set("page_size", String(nextPageSize));
    setSearchParams(nextParams);
  }

  const submissions = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Chức năng chủ quán</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Đơn đăng ký POI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi trạng thái các yêu cầu thêm địa điểm do bạn gửi.
          </p>
        </div>
        {session?.role?.permissions.includes("owner:poi_submit") && (
          <Button render={<Link to="/quan-ly/chu-quan/gui-yeu-cau-them-poi" />}>
            <PlusIcon aria-hidden="true" />
            Gửi đơn mới
          </Button>
        )}
      </header>

      {createdSubmissionId && (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>Gửi đơn đăng ký thành công</AlertTitle>
          <AlertDescription>
            Đơn {createdSubmissionId} đang chờ quản trị viên kiểm duyệt.
          </AlertDescription>
        </Alert>
      )}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách đơn</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              type="button"
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => setRequestVersion((version) => version + 1)}
            >
              <RefreshCwIcon aria-hidden="true" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <FileClockIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Danh sách đơn của tôi</h2>
          </div>

          <form className="flex flex-col gap-3 border-b p-4 sm:flex-row" onSubmit={applyFilters}>
            <Input
              value={queryDraft}
              maxLength={100}
              placeholder="Tìm theo tên hoặc địa chỉ..."
              aria-label="Tìm đơn theo tên hoặc địa chỉ"
              onChange={(event) => setQueryDraft(event.target.value)}
            />
            <select
              value={statusDraft}
              aria-label="Lọc theo trạng thái"
              onChange={(event) => setStatusDraft(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none sm:w-44"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
            <Button type="submit" disabled={loading}>
              <SearchIcon aria-hidden="true" />
              Tìm kiếm
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setRequestVersion((version) => version + 1)}
            >
              <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
              Làm mới
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Địa điểm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="w-72">Địa chỉ</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-64 pr-4">Phản hồi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 6 }, (_, cellIndex) => (
                      <TableCell key={cellIndex}><Skeleton className="h-7 w-full min-w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && submissions.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <InboxIcon className="size-8" aria-hidden="true" />
                      <p className="font-medium text-foreground">Chưa có đơn đăng ký</p>
                      <p>Gửi một đơn mới để đăng ký địa điểm của bạn.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading && submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="pl-4">
                    <p className="max-w-56 truncate font-medium">{submission.name}</p>
                    <p className="max-w-56 truncate text-xs text-muted-foreground">{submission.id}</p>
                  </TableCell>
                  <TableCell>{submission.category_name}</TableCell>
                  <TableCell>
                    <p className="line-clamp-2 max-w-72 whitespace-normal text-sm leading-5">{submission.address}</p>
                  </TableCell>
                  <TableCell>{formatDateTime(submission.created_at)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[submission.status]}`}>
                      {STATUS_LABELS[submission.status]}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4">
                    <p className="line-clamp-2 whitespace-normal text-sm text-muted-foreground">
                      {submission.admin_note || "Chưa có phản hồi"}
                    </p>
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
            itemLabel="đơn đăng ký"
            disabled={loading}
            onPageChange={(nextPage) => updatePagination(nextPage)}
            onPageSizeChange={(nextPageSize) => updatePagination(1, nextPageSize)}
          />
        </section>
      )}
    </div>
  );
}
