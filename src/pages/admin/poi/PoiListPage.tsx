import { useEffect, useState } from "react";
import { Link } from "react-router";
import { menuItemService } from "../../../services/MenuItemService";
import type { AdminPoi } from "../../../types/MenuItem";
import { getApiErrorMessage } from "#lib/api";

export default function PoiListPage() {
  const [items, setItems] = useState<AdminPoi[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await menuItemService.listPois(page);
        if (!response.success || !response.data) {
          throw new Error("Không có dữ liệu");
        }

        if (active) {
          setItems(response.data.data);
          setTotalPages(response.data.total_page);
        }
      } catch (error) {
        if (active) {
          setError(getApiErrorMessage(error, "Không tải được POI"));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Danh sách POI</h1>

      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Tên địa điểm</th>
                <th>Địa chỉ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((poi) => (
                <tr key={poi.id} className="border-b">
                  <td className="py-3">{poi.name}</td>
                  <td>{poi.address}</td>
                  <td>
                    <Link
                      className="underline"
                      to={`/quan-ly/dia-diem-poi/${poi.id}/mon-an`}
                    >
                      Xem món ăn
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!error && items.length === 0 && <p>Chưa có POI.</p>}
        </>
      )}

      <div className="flex gap-4">
        <button
          disabled={loading || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Trang trước
        </button>
        <span>Trang {page}</span>
        <button
          disabled={loading || page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}