import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  BadgeInfoIcon,
  BanknoteIcon,
  InboxIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { ListStats } from "#components/ListStats";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Skeleton } from "#components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";
import { getApiErrorMessage } from "#lib/api";
import { transactionLogService } from "../../../services/TransactionLogService";
import type { TransactionLog, TransactionLogPagination } from "../../../types/TransactionLog";

const PAGE_SIZE = 20;
const amountFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "medium",
});

const SAMPLE_LOGS: TransactionLog[] = [
  {
    id: "sample-1",
    transaction_date: "2026-11-16T01:15:00.000Z",
    content: "SEVQR BAC21D",
    amount: 250000,
    reference_code: "FT26320000123456",
    created_at: "2026-11-16T01:15:01.000Z",
  },
  {
    id: "sample-2",
    transaction_date: "2026-11-16T02:30:00.000Z",
    content: "SEVQR C3D4EF",
    amount: 500000,
    reference_code: "FT26320000654321",
    created_at: "2026-11-16T02:30:02.000Z",
  },
  {
    id: "sample-3",
    transaction_date: "2026-11-16T03:45:00.000Z",
    content: "SEVQR E5F6GH",
    amount: 150000,
    reference_code: "FT26320000987654",
    created_at: "2026-11-16T03:45:01.000Z",
  },
];

export default function TransactionLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const query = searchParams.get("q") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";
  const [data, setData] = useState<TransactionLogPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await transactionLogService.list(
          { q: query, dateFrom, dateTo, page, pageSize: PAGE_SIZE },
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error(response.message);
        if (!controller.signal.aborted) setData(response.data);
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(requestError, "Không thể tải lịch sử giao dịch."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, query, dateFrom, dateTo, requestVersion]);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextQuery = String(form.get("q") || "").trim();
    const params = new URLSearchParams({ page: "1" });
    if (nextQuery) params.set("q", nextQuery);
    const nextDateFrom = String(form.get("date_from") || "");
    const nextDateTo = String(form.get("date_to") || "");
    if (nextDateFrom) params.set("date_from", nextDateFrom);
    if (nextDateTo) params.set("date_to", nextDateTo);
    setSearchParams(params);
  }

  const usingSamples = !loading && !error && (data?.total_item ?? 0) === 0;
  const normalizedQuery = query.toLocaleLowerCase("vi");
  const logs = usingSamples
    ? SAMPLE_LOGS.filter((item) =>
        `${item.reference_code} ${item.content}`.toLocaleLowerCase("vi").includes(normalizedQuery),
      )
    : data?.data ?? [];
  const total = usingSamples ? logs.length : data?.total_item ?? 0;
  const totalAmount = usingSamples
    ? logs.reduce((sum, item) => sum + Number(item.amount), 0)
    : Number(data?.total_amount ?? 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Thanh toán</p>
          <div className="mt-1 flex items-center gap-3">
            <ReceiptTextIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Lịch sử giao dịch</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Theo dõi các giao dịch được tiếp nhận từ IPN.</p>
        </div>
        <Button type="button" variant="outline" disabled={loading} onClick={() => setRequestVersion((value) => value + 1)}>
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} /> Làm mới
        </Button>
      </header>

      <ListStats total={total} visible={logs.length} pages={usingSamples ? 1 : data?.total_page ?? 0} loading={loading} error={Boolean(error)} />

      <section className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BanknoteIcon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">Tổng doanh thu theo bộ lọc</p>
          <p className="text-xl font-semibold">{loading ? "—" : amountFormatter.format(totalAmount)}</p>
        </div>
      </section>

      {usingSamples && (
        <Alert>
          <BadgeInfoIcon />
          <AlertTitle>Đang hiển thị dữ liệu minh họa</AlertTitle>
          <AlertDescription>Database chưa có giao dịch IPN. Các dòng bên dưới chỉ phục vụ dựng giao diện và không được lưu vào database.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Không thể tải giao dịch</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <form className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]" onSubmit={applyFilter}>
          <Input name="q" defaultValue={query} placeholder="Mã tham chiếu hoặc nội dung" />
          <Input name="date_from" type="date" defaultValue={dateFrom} aria-label="Từ ngày" />
          <Input name="date_to" type="date" defaultValue={dateTo} aria-label="Đến ngày" />
          <Button type="submit" disabled={loading}><SearchIcon /> Tìm</Button>
        </form>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Ngày giao dịch</TableHead>
              <TableHead>Mã tham chiếu</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="pr-4 text-right">Số tiền</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }, (_, row) => (
              <TableRow key={row}>{Array.from({ length: 4 }, (_, cell) => <TableCell key={cell}><Skeleton className="h-7 min-w-24" /></TableCell>)}</TableRow>
            ))}
            {!loading && logs.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="size-8" />
                    <p className="font-medium text-foreground">Chưa có giao dịch phù hợp</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="pl-4 whitespace-nowrap">{dateFormatter.format(new Date(log.transaction_date))}</TableCell>
                <TableCell><code className="text-xs">{log.reference_code}</code></TableCell>
                <TableCell>{log.content}</TableCell>
                <TableCell className="pr-4 text-right font-medium">{amountFormatter.format(Number(log.amount))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!usingSamples && (
          <DataPagination
            page={data?.page ?? page}
            pageSize={PAGE_SIZE}
            totalItems={data?.total_item ?? 0}
            totalPages={data?.total_page ?? 0}
            itemLabel="giao dịch"
            disabled={loading}
            onPageChange={(nextPage) => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(nextPage));
              setSearchParams(params);
            }}
            onPageSizeChange={() => undefined}
          />
        )}
      </section>
    </div>
  );
}
