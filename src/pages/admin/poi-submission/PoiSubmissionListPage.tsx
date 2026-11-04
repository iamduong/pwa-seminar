import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  EyeIcon,
  FileTextIcon,
  InboxIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import HybridMap from "#components/map/HybridMap";
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
import useQuery from "#hooks/use-query";
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
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300",
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

const PoiSubmissionListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { execute, inProcess } = useQuery();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = parsePositiveInteger(
    searchParams.get("page_size"),
    20,
  );
  const pageSize = PAGE_SIZES.includes(requestedPageSize)
    ? requestedPageSize
    : 20;
  const query = searchParams.get("q")?.slice(0, 100) ?? "";
  const status = parseStatus(searchParams.get("status"));

  const [queryDraft, setQueryDraft] = useState(query);
  const [statusDraft, setStatusDraft] = useState(status ?? "all");
  const [data, setData] = useState<PoiSubmissionPagination | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    void execute(
      async () => {
        const response = await poiSubmissionService.GetPoiSubmissions({
          page,
          pageSize,
          q: query,
          status,
        });

        if (!response.success || !response.data) {
          throw new Error(response.message || "Dữ liệu trả về không hợp lệ.");
        }

        setErrorMessage(null);
        setData(response.data);
      },
      {
        onError: (error) => {
          setData(null);
          setErrorMessage(error.message);
        },
      },
    );
  }, [execute, page, pageSize, query, requestVersion, status]);

  const updatePagination = (nextPage: number, nextPageSize = pageSize) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    nextParams.set("page_size", String(nextPageSize));
    setSearchParams(nextParams);
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const nextParams = new URLSearchParams();
    nextParams.set("page", "1");
    nextParams.set("page_size", String(pageSize));
    if (queryDraft.trim()) nextParams.set("q", queryDraft.trim());
    if (statusDraft !== "all") nextParams.set("status", statusDraft);
    setSearchParams(nextParams);
  };

  const refresh = () => {
    setErrorMessage(null);
    setRequestVersion((version) => version + 1);
  };

  const submissions = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Đơn đăng ký POI
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi các yêu cầu thêm địa điểm đang chờ xử lý.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={inProcess}
          onClick={refresh}
        >
          <RefreshCwIcon
            className={inProcess ? "animate-spin" : undefined}
            aria-hidden="true"
          />
          Làm mới
        </Button>
      </header>

      <HybridMap className="h-120" />

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              type="button"
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={refresh}
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <FileTextIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Danh sách đơn POI</h2>
          </div>

          <form
            className="flex flex-col gap-3 border-b p-4 sm:flex-row"
            onSubmit={applyFilters}
          >
            <Input
              value={queryDraft}
              maxLength={100}
              placeholder="Tìm theo tên hoặc địa chỉ..."
              onChange={(event) => setQueryDraft(event.target.value)}
            />
            <select
              value={statusDraft}
              onChange={(event) => setStatusDraft(event.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none sm:w-44"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
            <Button type="submit" disabled={inProcess}>
              <SearchIcon aria-hidden="true" />
              Tìm kiếm
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Địa điểm</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="w-80">Địa chỉ</TableHead>
                <TableHead>Bán kính</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="pr-4 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inProcess &&
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 7 }, (_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-7 w-full min-w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!inProcess && submissions.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <InboxIcon className="size-8" aria-hidden="true" />
                      <p className="font-medium text-foreground">
                        Không tìm thấy đơn đăng ký
                      </p>
                      <p>Hãy thử thay đổi từ khóa hoặc trạng thái.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!inProcess &&
                submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="pl-4">
                      <div className="max-w-56">
                        <p className="truncate font-medium">{submission.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {submission.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{submission.category_name}</TableCell>
                    <TableCell>
                      <p className="line-clamp-2 max-w-80 whitespace-normal wrap-break-word text-sm leading-5">
                        {submission.address}
                      </p>
                    </TableCell>
                    <TableCell>{submission.trigger_radius} m</TableCell>
                    <TableCell>{formatDateTime(submission.created_at)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[submission.status]}`}
                      >
                        {STATUS_LABELS[submission.status]}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        render={
                          <Link
                            to={`/quan-ly/don-dang-ky-poi/duyet-don-poi/${submission.id}`}
                          />
                        }
                        variant="ghost"
                        size="sm"
                      >
                        <EyeIcon aria-hidden="true" />
                        Xem
                      </Button>
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
            disabled={inProcess}
            onPageChange={(nextPage) => updatePagination(nextPage)}
            onPageSizeChange={(nextPageSize) =>
              updatePagination(1, nextPageSize)
            }
          />
        </section>
      )}
    </div>
  );
};

export default PoiSubmissionListPage;
