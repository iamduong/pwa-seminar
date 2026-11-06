import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { AdminPoi, MenuItem } from "../../../types/MenuItem";

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
          menuItemService.listByPoi(poiId, page, false),
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
      } catch (requestError) {
        if (active) setLoadError(getApiErrorMessage(requestError, "Không tải được món chờ duyệt."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [poiId, page, reload]);

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
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Duyệt món ăn tại {poi?.name ?? "địa điểm"}</h1>
        {poi && <p className="mt-1 text-muted-foreground">{poi.address}</p>}
        <p className="mt-2 text-sm text-muted-foreground">Danh sách món chưa được duyệt hiển thị.</p>
      </header>
      <div className="flex flex-wrap items-center gap-4">
        <Link className="underline" to={`/quan-ly/dia-diem-poi/${poiId}/mon-an`}>Quay lại danh sách món ăn</Link>
        <button className="rounded border px-3 py-2 disabled:opacity-50" disabled={loading || busy !== null}
          onClick={() => setReload((value) => value + 1)}>Làm mới</button>
      </div>
      {loadError && <p role="alert" className="text-destructive">{loadError}</p>}
      {reviewError && <p role="alert" className="text-destructive">{reviewError}</p>}
      {message && <p role="status" className="text-emerald-700">{message}</p>}
      {loading ? <p role="status">Đang tải...</p> : !loadError && (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="space-y-3 rounded border bg-card p-4">
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.description || "Chưa có mô tả."}</p>
              <p>Giá: {item.price === null ? "Chưa có giá" : `${item.price.toLocaleString("vi-VN")} đ`}</p>
              <p>Duyệt hiển thị: {item.is_active ? "Đã duyệt" : "Chưa duyệt"}</p>
              <p>Trạng thái bán: {item.is_available ? "Đang bán" : "Tạm ngưng"}</p>
              {!item.is_active && (
                <button className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
                  disabled={busy !== null} onClick={() => void review(item)}>
                  {busy === item.id ? "Đang duyệt..." : "Duyệt món"}
                </button>
              )}
            </article>
          ))}
          {items.length === 0 && <p className="rounded border p-6 text-center text-muted-foreground md:col-span-2">Không có món ăn chờ duyệt.</p>}
        </div>
      )}
      <nav className="flex items-center gap-4" aria-label="Phân trang món chờ duyệt">
        <button className="rounded border px-3 py-2 disabled:opacity-50" disabled={loading || busy !== null || page <= 1}
          onClick={() => setPage((value) => value - 1)}>Trang trước</button>
        <span>Trang {page} / {Math.max(1, totalPages)}</span>
        <button className="rounded border px-3 py-2 disabled:opacity-50" disabled={loading || busy !== null || !!loadError || page >= totalPages}
          onClick={() => setPage((value) => value + 1)}>Trang sau</button>
      </nav>
    </div>
  );
}
