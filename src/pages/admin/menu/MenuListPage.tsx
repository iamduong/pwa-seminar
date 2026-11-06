import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { AdminPoi, MenuItem } from "../../../types/MenuItem";

export default function MenuListPage() {
  const { poiId } = useParams();
  if (!poiId) return <p>Chưa chọn địa điểm.</p>;
  return <MenuList key={poiId} poiId={poiId} />;
}

function MenuList({ poiId }: { poiId: string }) {
  const [poi, setPoi] = useState<AdminPoi | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const basePath = `/quan-ly/dia-diem-poi/${poiId}/mon-an`;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [poiResponse, response] = await Promise.all([
          menuItemService.getPoi(poiId),
          menuItemService.listByPoi(poiId, page, filter === "all" ? undefined : filter === "approved"),
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
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, "Không tải được món ăn."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [poiId, page, filter, reload]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Món ăn tại {poi?.name ?? "địa điểm"}</h1>
        {poi && <p className="mt-1 text-muted-foreground">{poi.address}</p>}
      </header>
      <nav className="flex flex-wrap gap-4" aria-label="Quản lý món ăn">
        <Link className="underline" to="/quan-ly/dia-diem-poi/danh-sach-poi">Danh sách POI</Link>
        <Link className="underline" to={`${basePath}/them`}>Thêm món ăn</Link>
        <Link className="underline" to={`${basePath}/yeu-cau`}>Duyệt món ăn</Link>
      </nav>
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1">
          <span className="block text-sm">Trạng thái duyệt</span>
          <select className="rounded border bg-background px-3 py-2" value={filter}
            onChange={(event) => { setFilter(event.target.value); setPage(1); }}>
            <option value="all">Tất cả</option>
            <option value="pending">Chưa duyệt</option>
            <option value="approved">Đã duyệt</option>
          </select>
        </label>
        <button className="rounded border px-3 py-2 disabled:opacity-50" disabled={loading}
          onClick={() => setReload((value) => value + 1)}>Làm mới</button>
      </div>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {loading ? <p role="status">Đang tải...</p> : !error && (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-left">
            <thead className="bg-muted"><tr>
              <th scope="col" className="p-3">Tên món</th>
              <th scope="col" className="p-3">Giá</th>
              <th scope="col" className="p-3">Duyệt hiển thị</th>
              <th scope="col" className="p-3">Trạng thái bán</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3"><p className="font-medium">{item.name}</p>
                    {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                  </td>
                  <td className="whitespace-nowrap p-3">{item.price === null ? "Chưa có giá" : `${item.price.toLocaleString("vi-VN")} đ`}</td>
                  <td className="p-3">{item.is_active ? "Đã duyệt" : "Chưa duyệt"}</td>
                  <td className="p-3">{item.is_available ? "Đang bán" : "Tạm ngưng"}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Không có món ăn phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <nav className="flex items-center gap-4" aria-label="Phân trang món ăn">
        <button className="rounded border px-3 py-2 disabled:opacity-50" disabled={loading || page <= 1}
          onClick={() => setPage((value) => value - 1)}>Trang trước</button>
        <span>Trang {page} / {Math.max(1, totalPages)}</span>
        <button className="rounded border px-3 py-2 disabled:opacity-50" disabled={loading || !!error || page >= totalPages}
          onClick={() => setPage((value) => value + 1)}>Trang sau</button>
      </nav>
    </div>
  );
}
