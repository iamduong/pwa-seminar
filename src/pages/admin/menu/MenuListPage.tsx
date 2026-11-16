import { ListStats } from "#components/ListStats";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { AlertCircleIcon, ArrowLeftIcon, CheckCircle2Icon, InboxIcon, Loader2Icon, MapPinIcon, PlusIcon, RefreshCwIcon, UtensilsIcon } from "lucide-react";
import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button, buttonVariants } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";
import { useAuthorize } from "#hooks/use-authorize";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { AdminPoi, MenuItem } from "../../../types/MenuItem";

export default function MenuListPage() {
  const { poiId } = useParams();
  if (!poiId) return <p>Chưa chọn địa điểm.</p>;
  return <MenuList key={poiId} poiId={poiId} />;
}

function MenuList({ poiId }: { poiId: string }) {
  const { session } = useAuthorize();
  const canReview = session?.role?.permissions.includes("menu:review");
  const canCreate = session?.role?.permissions.includes("menu:create");
  const [poi, setPoi] = useState<AdminPoi | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status");
  const filter = status === "pending" || status === "approved" ? status : "all";
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const basePath = `/quan-ly/dia-diem-poi/${poiId}/mon-an`;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [poiResponse, response] = await Promise.all([
          menuItemService.getPoi(poiId),
          menuItemService.listByPoi(
            poiId,
            page,
            filter === "all" ? undefined : filter === "approved",
            undefined,
            pageSize,
          ),
        ]);
        if (!poiResponse.success || !poiResponse.data) {
          throw new Error(poiResponse.message || "Không tải được địa điểm.");
        }
        if (!response.success || !response.data) {
          throw new Error(response.message || "Không tải được món ăn.");
        }
        if (!active) return;
        const lastPage = Math.max(1, response.data.total_page);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setPoi(poiResponse.data);
        setItems(response.data.data);
        setTotalPages(response.data.total_page);
        setTotalItems(response.data.total_item);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Không tải được món ăn."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [poiId, page, pageSize, filter, reload]);

  async function review(item: MenuItem) {
    if (!canReview || submitting.current || loading || item.is_active) return;
    submitting.current = true;
    setBusy(item.id);
    setReviewError("");
    setMessage("");
    try {
      const response = await menuItemService.approveItem(poiId, item.id);
      if (!response.success) throw new Error(response.message || "Không thể duyệt món ăn.");
      setMessage(`Đã duyệt món “${item.name}” và đưa vào hàng đợi dịch.`);
    } catch (requestError) {
      setReviewError(getApiErrorMessage(requestError, "Không thể duyệt món ăn."));
    } finally {
      submitting.current = false;
      setBusy(null);
      // Đối chiếu lại trạng thái server kể cả khi mất phản hồi duyệt.
      setLoading(true);
      setReload((value) => value + 1);
    }
  }

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-ring" to="/quan-ly/danh-sach-thuc-don">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Thực đơn tại POI
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Quản lý địa điểm POI</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight break-words">Món ăn tại {poi?.name ?? "địa điểm"}</h1>
          {poi && <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {poi.address || "Chưa có địa chỉ"}
          </p>}
          <p className="mt-2 text-sm text-muted-foreground">Theo dõi trạng thái xét duyệt và hiển thị của các món ăn.</p>
        </div>
        <nav className="flex shrink-0 flex-wrap gap-2" aria-label="Quản lý món ăn">
          <Link className={buttonVariants({ variant: "outline" })} to="/quan-ly/tien-trinh-dich-mon-an">Tiến trình dịch</Link>
          {canCreate && <Link className={buttonVariants()} to={`${basePath}/them`}>
            <PlusIcon aria-hidden="true" />Thêm món ăn
          </Link>}
        </nav>
      </header>

      <ListStats total={totalItems} visible={items.length} pages={totalPages} loading={loading} error={Boolean(error)} />
      {reviewError && <Alert variant="destructive"><AlertCircleIcon aria-hidden="true" /><AlertTitle>Không thể duyệt món ăn</AlertTitle><AlertDescription>{reviewError}</AlertDescription></Alert>}
      {message && <Alert role="status"><CheckCircle2Icon aria-hidden="true" /><AlertTitle>Duyệt thành công</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="menu-list-title" aria-busy={loading || busy !== null}>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <UtensilsIcon className="size-4" aria-hidden="true" />
          <h2 id="menu-list-title" className="font-semibold">Danh sách món ăn</h2>
        </div>
        <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full space-y-2 sm:max-w-xs">
            <label htmlFor="menu-approval-filter" className="text-sm font-medium">Trạng thái duyệt</label>
            <select id="menu-approval-filter" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" value={filter} disabled={loading || busy !== null}
              onChange={(event) => { setSearchParams({ status: event.target.value }); setPage(1); setLoading(true); }}>
              <option value="all">Tất cả</option>
              <option value="pending">Chưa duyệt</option>
              <option value="approved">Đã duyệt</option>
            </select>
          </div>
          <Button type="button" variant="outline" className="w-fit" disabled={loading || busy !== null} onClick={() => { setLoading(true); setReload((value) => value + 1); }}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />Làm mới
          </Button>
        </div>
        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircleIcon aria-hidden="true" />
              <AlertTitle>Không thể tải danh sách món ăn</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setReload((value) => value + 1)}>
                  <RefreshCwIcon aria-hidden="true" />Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Tên món</TableHead>
                <TableHead>Duyệt hiển thị</TableHead>
                <TableHead className="pr-4">Hiển thị</TableHead>
                {canReview && <TableHead className="pr-4 text-right">Thao tác</TableHead>}
              </TableRow></TableHeader>
              <TableBody>
                {loading && Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-4 pl-4"><Skeleton className="h-5 w-36" /><Skeleton className="mt-2 h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="pr-4"><Skeleton className="h-6 w-24" /></TableCell>
                    {canReview && <TableCell className="pr-4"><Skeleton className="ml-auto h-7 w-24" /></TableCell>}
                  </TableRow>
                ))}
                {!loading && items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-56 max-w-md py-4 pl-4 whitespace-normal">
                      <p className="font-medium">{item.name}</p>
                      {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                    </TableCell>
                    <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.is_active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {item.is_active ? "Đã duyệt" : "Chưa duyệt"}
                    </span></TableCell>
                    <TableCell className="pr-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.is_available ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {item.is_available ? "Đang hiển thị" : item.is_active ? "Chưa dịch xong" : "Chờ duyệt"}
                    </span></TableCell>
                    {canReview && <TableCell className="pr-4 text-right">
                      {!item.is_active && <Button type="button" size="sm" disabled={busy !== null} onClick={() => void review(item)} aria-label={`Duyệt món ${item.name}`}>
                        {busy === item.id ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <CheckCircle2Icon aria-hidden="true" />}
                        {busy === item.id ? "Đang duyệt..." : "Duyệt món"}
                      </Button>}
                    </TableCell>}
                  </TableRow>
                ))}
                {!loading && items.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={canReview ? 4 : 3} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="size-8" aria-hidden="true" />
                    <p className="font-medium text-foreground">Không có món ăn phù hợp</p>
                    <p>{filter === "all" ? "Các món ăn sẽ hiển thị tại đây khi được thêm vào địa điểm." : "Hãy thử chọn trạng thái duyệt khác."}</p>
                  </div>
                </TableCell></TableRow>}
              </TableBody>
            </Table>
            <DataPagination page={page} pageSize={pageSize} totalItems={totalItems} totalPages={totalPages} itemLabel="món ăn" disabled={loading || busy !== null}
              onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
          </>
        )}
      </section>
    </div>
  );
}
