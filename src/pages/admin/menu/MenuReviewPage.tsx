import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { AdminPoi, MenuItem } from "../../../types/MenuItem";
import { AlertCircleIcon, ArrowLeftIcon, CheckCircle2Icon, ClipboardCheckIcon, InboxIcon, Loader2Icon, MapPinIcon, RefreshCwIcon } from "lucide-react";
import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";

export default function MenuReviewPage() {
  const { poiId } = useParams();
  if (!poiId) return <p>Chưa chọn địa điểm.</p>;
  return <MenuReview key={poiId} poiId={poiId} />;
}

function MenuReview({ poiId }: { poiId: string }) {
  const [poi, setPoi] = useState<AdminPoi | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [message, setMessage] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [poiResponse, response] = await Promise.all([
          menuItemService.getPoi(poiId),
          menuItemService.listByPoi(poiId, page, false, undefined, pageSize),
        ]);
        if (!poiResponse.success || !poiResponse.data) {
          throw new Error(poiResponse.message || "Không tải được địa điểm.");
        }
        if (!response.success || !response.data) {
          throw new Error(response.message || "Không tải được món chờ duyệt.");
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
        if (active) setLoadError(getApiErrorMessage(requestError, "Không tải được món chờ duyệt."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [poiId, page, pageSize, reload]);

  async function review(item: MenuItem) {
    if (submitting.current || loading || item.is_active) return;
    submitting.current = true;
    setBusy(item.id);
    setReviewError("");
    setMessage("");
    try {
      const response = await menuItemService.approveItem(poiId, item.id);
      if (!response.success) throw new Error(response.message || "Không thể duyệt món ăn.");
      setMessage(`Đã duyệt món “${item.name}”.`);
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
      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-ring" to={`/quan-ly/dia-diem-poi/${poiId}/mon-an`}>
        <ArrowLeftIcon className="size-4" aria-hidden="true" />Danh sách món ăn
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Quản lý địa điểm POI</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight break-words">Duyệt món ăn tại {poi?.name ?? "địa điểm"}</h1>
          {poi && <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground"><MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{poi.address || "Chưa có địa chỉ"}</p>}
          <p className="mt-2 text-sm text-muted-foreground">Kiểm tra thông tin và duyệt các món ăn đang chờ hiển thị.</p>
        </div>
        <Button type="button" variant="outline" className="w-fit" disabled={loading || busy !== null} onClick={() => setReload((value) => value + 1)}>
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />Làm mới
        </Button>
      </header>
      {reviewError && <Alert variant="destructive"><AlertCircleIcon aria-hidden="true" /><AlertTitle>Không thể duyệt món ăn</AlertTitle><AlertDescription>{reviewError}</AlertDescription></Alert>}
      {message && <Alert role="status"><CheckCircle2Icon className="text-green-700" aria-hidden="true" /><AlertTitle>Duyệt thành công</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}
      {loadError ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" /><AlertTitle>Không thể tải danh sách chờ duyệt</AlertTitle>
          <AlertDescription><p>{loadError}</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" disabled={busy !== null} onClick={() => setReload((value) => value + 1)}><RefreshCwIcon aria-hidden="true" />Thử lại</Button>
          </AlertDescription>
        </Alert>
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="menu-review-title" aria-busy={loading || busy !== null}>
          <div className="flex items-center gap-2 border-b px-4 py-3"><ClipboardCheckIcon className="size-4" aria-hidden="true" /><h2 id="menu-review-title" className="font-semibold">Món ăn chờ duyệt</h2></div>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Tên món</TableHead><TableHead className="text-right">Giá</TableHead><TableHead>Duyệt hiển thị</TableHead><TableHead>Trạng thái bán</TableHead><TableHead className="pr-4 text-right">Thao tác</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }, (_, index) => <TableRow key={index}>
                <TableCell className="py-4 pl-4"><Skeleton className="h-5 w-36" /><Skeleton className="mt-2 h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-5 w-20" /></TableCell><TableCell><Skeleton className="h-6 w-24" /></TableCell><TableCell><Skeleton className="h-6 w-24" /></TableCell><TableCell className="pr-4"><Skeleton className="ml-auto h-7 w-24" /></TableCell>
              </TableRow>)}
              {!loading && items.map((item) => <TableRow key={item.id}>
                <TableCell className="min-w-56 max-w-md py-4 pl-4 whitespace-normal"><p className="font-medium">{item.name}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.description || "Chưa có mô tả."}</p></TableCell>
                <TableCell className="text-right font-medium tabular-nums">{item.price === null ? <span className="font-normal text-muted-foreground">Chưa có giá</span> : `${item.price.toLocaleString("vi-VN")} đ`}</TableCell>
                <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.is_active ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{item.is_active ? "Đã duyệt" : "Chưa duyệt"}</span></TableCell>
                <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.is_available ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{item.is_available ? "Đang bán" : "Tạm ngưng"}</span></TableCell>
                <TableCell className="pr-4 text-right">{!item.is_active && <Button type="button" size="sm" disabled={busy !== null} onClick={() => void review(item)} aria-label={`Duyệt món ${item.name}`}>
                  {busy === item.id ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <CheckCircle2Icon aria-hidden="true" />}{busy === item.id ? "Đang duyệt..." : "Duyệt món"}
                </Button>}</TableCell>
              </TableRow>)}
              {!loading && items.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="h-64 text-center"><div className="flex flex-col items-center gap-2 text-muted-foreground"><InboxIcon className="size-8" aria-hidden="true" /><p className="font-medium text-foreground">Không có món ăn chờ duyệt</p><p>Các món cần xét duyệt sẽ hiển thị tại đây.</p></div></TableCell></TableRow>}
            </TableBody>
          </Table>
          <DataPagination page={page} pageSize={pageSize} totalItems={totalItems} totalPages={totalPages} itemLabel="món chờ duyệt" disabled={loading || busy !== null} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1); }} />
        </section>
      )}
    </div>
  );
}
