import { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  BanknoteIcon,
  CopyIcon,
  InboxIcon,
  Loader2Icon,
  PlusIcon,
  QrCodeIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { ListStats } from "#components/ListStats";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import { Input } from "#components/ui/input";
import { Skeleton } from "#components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";
import { getApiErrorMessage } from "#lib/api";
import { tourService } from "../../../services/TourService";
import type { Tour, TourPagination } from "../../../types/Tour";

const PAGE_SIZES = [20, 30, 50];
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function tourQrUrl(code: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(code)}`;
}

function paymentQrUrl(tour: Tour) {
  const amount = String(tour.price).replace(/\.00$/, "");
  return `https://vietqr.app/img?bank=VietinBank&acc=109881092754&template=qronly&amount=${encodeURIComponent(amount)}&des=SEVQR+${encodeURIComponent(tour.code)}&showinfo=false`;
}

export default function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = positiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const query = searchParams.get("q") ?? "";
  const showDeleted = searchParams.get("status") === "deleted";

  const [data, setData] = useState<TourPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [qrTour, setQrTour] = useState<Tour | null>(null);
  const [qrMode, setQrMode] = useState<"tour" | "payment">("tour");
  const [pendingAction, setPendingAction] = useState<{ tour: Tour; type: "delete" | "restore" } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await tourService.list(
          { q: query, page, pageSize, isDeleted: showDeleted },
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error(response.message);
        if (!controller.signal.aborted) setData(response.data);
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setError(getApiErrorMessage(requestError, "Không thể tải danh sách tour."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, pageSize, query, showDeleted, requestVersion]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("page_size", String(pageSize));
    params.set("status", String(form.get("status") || "active"));
    const nextQuery = String(form.get("q") || "").trim();
    if (nextQuery) params.set("q", nextQuery);
    setSearchParams(params);
  }

  function updatePage(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    params.set("page_size", String(nextPageSize));
    setSearchParams(params);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setProcessing(true);
    setError(null);
    try {
      if (pendingAction.type === "delete") {
        await tourService.delete(pendingAction.tour.id);
      } else {
        await tourService.restore(pendingAction.tour.id);
      }
      setPendingAction(null);
      setRequestVersion((value) => value + 1);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Không thể cập nhật trạng thái tour."));
      setPendingAction(null);
    } finally {
      setProcessing(false);
    }
  }

  function openQr(tour: Tour, mode: "tour" | "payment") {
    setQrMode(mode);
    setQrTour(tour);
  }

  const tours = data?.data ?? [];
  const qrUrl = qrTour
    ? qrMode === "tour" ? tourQrUrl(qrTour.code) : paymentQrUrl(qrTour)
    : "";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản lý tour</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Danh sách tour</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý POI, mã tham gia và mã thanh toán của từng tour.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => setRequestVersion((value) => value + 1)}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} /> Làm mới
          </Button>
          <Button nativeButton={false} render={<Link to="/quan-ly/tour/them" />}>
            <PlusIcon /> Thêm tour
          </Button>
        </div>
      </header>

      <ListStats total={data?.total_item ?? 0} visible={tours.length} pages={data?.total_page ?? 0} loading={loading} error={Boolean(error)} />

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Không thể thực hiện yêu cầu</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <form className="flex flex-col gap-3 border-b p-4 sm:flex-row" onSubmit={applyFilters}>
          <Input name="q" defaultValue={query} placeholder="Tìm theo mã tour" className="sm:max-w-sm" />
          <select name="status" defaultValue={showDeleted ? "deleted" : "active"} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="active">Đang sử dụng</option>
            <option value="deleted">Đã xóa</option>
          </select>
          <Button type="submit" disabled={loading}><SearchIcon /> Lọc</Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Mã tour</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Số người</TableHead>
              <TableHead>POI</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead className="pr-4 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }, (_, row) => (
              <TableRow key={row}>{Array.from({ length: 6 }, (_, cell) => <TableCell key={cell}><Skeleton className="h-7 min-w-20" /></TableCell>)}</TableRow>
            ))}
            {!loading && tours.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="size-8" />
                    <p className="font-medium text-foreground">Chưa có tour phù hợp</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && tours.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell className="pl-4"><code className="font-semibold">{tour.code}</code></TableCell>
                <TableCell>{currencyFormatter.format(Number(tour.price))}</TableCell>
                <TableCell>{tour.scanned_people}/{tour.max_people}</TableCell>
                <TableCell>
                  <details>
                    <summary className="cursor-pointer text-sm text-primary">{tour.pois.length} địa điểm</summary>
                    <ul className="mt-2 max-w-64 space-y-1 text-xs text-muted-foreground">
                      {tour.pois.map((poi) => <li key={poi.id}>{poi.name}</li>)}
                    </ul>
                  </details>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">{dateFormatter.format(new Date(tour.expires_at))}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
                    {!showDeleted && (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => openQr(tour, "tour")}><QrCodeIcon /> QR tour</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => openQr(tour, "payment")}><BanknoteIcon /> Thanh toán</Button>
                        <Button type="button" size="icon-sm" variant="ghost" aria-label={`Xóa ${tour.code}`} onClick={() => setPendingAction({ tour, type: "delete" })}><Trash2Icon /></Button>
                      </>
                    )}
                    {showDeleted && (
                      <Button type="button" size="sm" variant="outline" onClick={() => setPendingAction({ tour, type: "restore" })}><RotateCcwIcon /> Khôi phục</Button>
                    )}
                  </div>
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
          itemLabel="tour"
          disabled={loading}
          onPageChange={(nextPage) => updatePage(nextPage)}
          onPageSizeChange={(nextSize) => updatePage(1, nextSize)}
        />
      </section>

      <Dialog open={Boolean(qrTour)} onOpenChange={(open) => !open && setQrTour(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{qrMode === "tour" ? "Mã QR tour" : "Mã QR thanh toán"}</DialogTitle>
            <DialogDescription>
              {qrMode === "tour" ? "Người dùng quét để nhận mã tour." : "VietQR đã điền sẵn số tiền và nội dung chuyển khoản."}
            </DialogDescription>
          </DialogHeader>
          {qrTour && (
            <div className="flex flex-col items-center gap-4 py-2">
              <img src={qrUrl} alt={qrMode === "tour" ? `QR tour ${qrTour.code}` : `QR thanh toán ${qrTour.code}`} className="size-72 rounded-lg border bg-white object-contain p-2" />
              <div className="w-full rounded-lg border bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground">Mã tour</p>
                <code className="mt-1 block text-lg font-semibold">{qrTour.code}</code>
                {qrMode === "payment" && <p className="mt-2 text-sm">{currencyFormatter.format(Number(qrTour.price))}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => qrTour && void navigator.clipboard.writeText(qrTour.code)}><CopyIcon /> Sao chép mã</Button>
            <Button type="button" onClick={() => setQrTour(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction?.type === "delete" ? "Xóa tour" : "Khôi phục tour"}</DialogTitle>
            <DialogDescription>
              {pendingAction?.type === "delete"
                ? `Tour ${pendingAction.tour.code} sẽ được xóa mềm và có thể khôi phục sau.`
                : `Tour ${pendingAction?.tour.code} sẽ hoạt động trở lại.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={processing} onClick={() => setPendingAction(null)}>Hủy</Button>
            <Button type="button" variant={pendingAction?.type === "delete" ? "destructive" : "default"} disabled={processing} onClick={() => void confirmAction()}>
              {processing ? <Loader2Icon className="animate-spin" /> : pendingAction?.type === "delete" ? <Trash2Icon /> : <RotateCcwIcon />}
              {processing ? "Đang xử lý..." : pendingAction?.type === "delete" ? "Xóa tour" : "Khôi phục"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
