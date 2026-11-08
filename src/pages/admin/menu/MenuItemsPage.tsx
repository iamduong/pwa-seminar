import { useEffect, useState } from "react";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { MenuItem } from "../../../types/MenuItem";
import { useAuthorize } from "../../../hooks/use-authorize";

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const { session } = useAuthorize();
  const canEdit = session?.role?.permissions.includes("owner:menu_submit");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadItems() {
      try {
        const response = await menuItemService.listMine();
        if (!response.success || !response.data) {
          throw new Error("Không thể tải danh sách thực đơn.");
        }
        if (!cancelled) setItems(response.data);
      } catch (requestError: unknown) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Không thể tải danh sách thực đơn."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadItems();
    return () => { cancelled = true; };
  }, [reload]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Chức năng chủ quán</p>
          <h1 className="mt-1 text-2xl font-semibold">Thực đơn của tôi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi các món ăn đã gửi và trạng thái xét duyệt.
          </p>
        </div>
        <Button variant="outline" onClick={() => {
          setLoading(true);
          setError("");
          setReload((value) => value + 1);
        }} disabled={loading}>
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
          Làm mới
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Không thể tải thực đơn</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {loading && <p role="status">Đang tải thực đơn...</p>}

      {!error && !loading && items.length === 0 && (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Chưa có món ăn nào được gửi.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{item.name}</h2>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {item.is_active ? "Đã duyệt" : "Chờ duyệt"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description || "Không có mô tả."}
            </p>
            {item.price !== null && (
              <p className="mt-3 font-medium">
                {item.price.toLocaleString("vi-VN")} đ
              </p>
            )}
            {canEdit && (
              <Link className="mt-3 inline-block text-sm font-medium underline" to={`${item.id}/chinh-sua`}>
                Chỉnh sửa
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
