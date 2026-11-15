import { useEffect, useRef, useState } from "react";
import { LanguagesIcon, Loader2Icon, RefreshCwIcon, RotateCcwIcon } from "lucide-react";
import { Link } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";
import { getApiErrorMessage } from "#lib/api";
import { cn } from "#lib/utils";
import { useAuthorize } from "../../../hooks/use-authorize";
import { menuItemService } from "../../../services/MenuItemService";
import type { MenuTranslationStatus, MenuTranslationTask } from "../../../types/MenuItem";
import type { Pagination } from "../../../types/contract/Pagination";

const TASK_LABELS: Record<MenuTranslationStatus, string> = {
  queued: "Đang chờ", running: "Đang dịch", done: "Hoàn tất", failed: "Thất bại",
};
const LANGUAGE_LABELS: Record<string, string> = {
  "vi-VN": "Tiếng Việt", "en-US": "Tiếng Anh", "zh-CN": "Tiếng Trung",
  "ja-JP": "Tiếng Nhật", "ko-KR": "Tiếng Hàn",
};
const TRANSLATION_LABELS = {
  pending: "Chờ dịch", processing: "Đang dịch", ready: "Hoàn tất", failed: "Thất bại",
};
const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "medium" });

export default function MenuTranslationMonitorPage() {
  const { session } = useAuthorize();
  const canRead = session?.role?.permissions.includes("menu:read");
  const canRetry = session?.role?.permissions.includes("menu:review");
  const [data, setData] = useState<Pagination<MenuTranslationTask> | null>(null);
  const [filter, setFilter] = useState<MenuTranslationStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const [retrying, setRetrying] = useState<string | null>(null);
  const submitting = useRef(false);
  const tasks = data?.data ?? [];
  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0];

  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const response = await menuItemService.listTranslations(page, pageSize, filter === "all" ? undefined : filter, controller.signal);
        if (controller.signal.aborted) return;
        if (!response.success || !response.data) throw new Error("Invalid response");
        const lastPage = Math.max(1, response.data.total_page);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setData(response.data);
        setError("");
      } catch (requestError) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError, "Không thể tải tiến trình dịch món ăn."));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(() => void load(), 2000);
        }
      }
    }
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [canRead, filter, page, pageSize, reload]);

  async function retry(task: MenuTranslationTask) {
    if (submitting.current) return;
    submitting.current = true;
    setRetrying(task.id);
    setMessage("");
    try {
      const response = await menuItemService.retryTranslations(task.id);
      if (!response.success) throw new Error("Invalid response");
      setMessage(`Đã đưa các bản dịch lỗi của món “${task.name}” vào hàng đợi.`);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Không thể dịch lại món ăn."));
    } finally {
      submitting.current = false;
      setRetrying(null);
    }
  }

  if (!canRead) return <Alert><AlertTitle>Bạn không có quyền xem tiến trình dịch món ăn.</AlertTitle></Alert>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản lý ẩm thực</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Theo dõi tiến trình dịch món ăn</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tự động cập nhật mỗi 2 giây. Món ăn chỉ hiển thị khi tất cả ngôn ngữ hoàn tất.</p>
        </div>
        <Button variant="outline" disabled={loading} onClick={() => { setLoading(true); setReload((value) => value + 1); }}>
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />Làm mới
        </Button>
      </header>
      {error && <Alert variant="destructive"><AlertTitle>Không thể cập nhật tiến trình</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {message && <Alert role="status"><AlertTitle>Đã yêu cầu dịch lại</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}
      <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="menu-translations-title" aria-busy={loading}>
          <div className="space-y-3 border-b p-4">
            <h2 id="menu-translations-title" className="font-semibold">Danh sách tiến trình</h2>
            <label className="block space-y-2 text-sm">
              <span>Trạng thái</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring" value={filter}
                onChange={(event) => { setFilter(event.target.value as typeof filter); setPage(1); setLoading(true); }}>
                <option value="all">Tất cả</option>
                {Object.entries(TASK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto p-2 lg:max-h-[36rem]">
            {loading && !data ? <p className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground" role="status"><Loader2Icon className="size-4 animate-spin" aria-hidden="true" />Đang tải…</p>
              : tasks.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Chưa có tiến trình phù hợp.</p>
              : tasks.map((task) => (
                <button type="button" key={task.id} aria-pressed={selected?.id === task.id} onClick={() => setSelectedId(task.id)}
                  className={cn("w-full space-y-2 rounded-lg border p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring", selected?.id === task.id ? "border-primary bg-muted" : "border-transparent")}>
                  <span className="block truncate text-sm font-medium">{task.name}</span>
                  <span className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{TASK_LABELS[task.status]}</span><span>{task.progress_percent}%</span></span>
                  <progress className="block h-2 w-full accent-primary" value={task.progress_percent} max={100} aria-label={`Tiến độ dịch ${task.name}`} />
                </button>
              ))}
          </div>
        </section>
        <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="menu-translation-detail-title">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0">
              <h2 id="menu-translation-detail-title" className="flex items-center gap-2 font-semibold"><LanguagesIcon className="size-4 shrink-0" aria-hidden="true" /><span className="break-words">{selected?.name ?? "Chi tiết bản dịch"}</span></h2>
              {selected && <p className="mt-2 text-sm text-muted-foreground">{TASK_LABELS[selected.status]} · {selected.is_available ? "Đang hiển thị" : "Chưa hiển thị"}</p>}
            </div>
            {selected && canRetry && selected.localizations.some((row) => row.translation_status === "failed") && (
              <Button variant="outline" size="sm" disabled={retrying !== null} onClick={() => void retry(selected)}>
                <RotateCcwIcon className={retrying === selected.id ? "animate-spin" : undefined} aria-hidden="true" />Dịch lại bản lỗi
              </Button>
            )}
          </div>
          {selected ? <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4 text-sm">
              <span>{selected.localizations.filter((row) => row.translation_status === "ready").length}/{selected.localizations.length} ngôn ngữ hoàn tất</span>
              <Link className="underline underline-offset-4 focus-visible:outline-ring" to={`/quan-ly/dia-diem-poi/${selected.poi_id}/mon-an`}>Xem thực đơn</Link>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Ngôn ngữ</TableHead><TableHead>Trạng thái</TableHead><TableHead>Nội dung và lỗi</TableHead></TableRow></TableHeader>
              <TableBody>{selected.localizations.map((row) => <TableRow key={row.id}>
                <TableCell className="align-top">{LANGUAGE_LABELS[row.lang] ?? row.lang}</TableCell>
                <TableCell className="align-top"><span className={row.translation_status === "failed" ? "text-destructive" : undefined}>{TRANSLATION_LABELS[row.translation_status]}</span><time className="mt-1 block text-xs text-muted-foreground" dateTime={row.updated_at}>{DATE_FORMATTER.format(new Date(row.updated_at))}</time></TableCell>
                <TableCell className="min-w-48 max-w-xl whitespace-normal">
                  {row.translation_status === "ready" && <><p className="font-medium">{row.name}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{row.description || "Không có mô tả."}</p></>}
                  {row.error_message && <p className="text-sm text-destructive">{row.error_message}</p>}
                  {(row.translation_status === "pending" || row.translation_status === "processing") && <span className="text-sm text-muted-foreground">Đang chuẩn bị bản dịch.</span>}
                </TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </> : <p className="p-10 text-center text-sm text-muted-foreground">Chọn một món ăn để xem trạng thái từng ngôn ngữ.</p>}
        </section>
      </div>
      <DataPagination page={page} pageSize={pageSize} totalItems={data?.total_item ?? 0} totalPages={data?.total_page ?? 0} itemLabel="tiến trình" disabled={loading}
        onPageChange={(value) => { setPage(value); setLoading(true); }} onPageSizeChange={(value) => { setPageSize(value); setPage(1); setLoading(true); }} />
    </div>
  );
}
