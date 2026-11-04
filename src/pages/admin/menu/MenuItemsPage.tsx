import { useEffect, useState } from "react";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { MenuItemSubmission } from "../../../types/MenuItem";

const statusLabels = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
} as const;

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItemSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadItems() {
    setLoading(true);
    setError("");
    try {
      const response = await menuItemService.listMine();
      if (!response.success || !response.data) {
        throw new Error("Không thể tải danh sách thực đơn.");
      }
      setItems(response.data);
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Không thể tải danh sách thực đơn."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

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
        <Button variant="outline" onClick={() => void loadItems()} disabled={loading}>
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
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                item.status === "rejected"
                  ? "bg-destructive/10 text-destructive"
                  : item.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
              }`}>
                {statusLabels[item.status]}
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
            {item.admin_note && (
              <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                Phản hồi: {item.admin_note}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
