import { useEffect, useState } from "react";
import { AlertCircleIcon, PencilIcon, PlusIcon, RefreshCwIcon, UtensilsIcon } from "lucide-react";
import { Link } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/ui/table";
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Chức năng chủ quán</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Thực đơn của tôi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi các món ăn đã gửi và trạng thái xét duyệt.
          </p>
        </div>
        {canEdit && (
          <Button nativeButton={false} role="link" render={<Link to="/quan-ly/chuc-nang-chu-quan/gui-yeu-cau-thuc-don" />}>
            <PlusIcon aria-hidden="true" />
            Thêm món ăn
          </Button>
        )}
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Không thể tải thực đơn</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-label="Danh sách thực đơn" aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <UtensilsIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Danh sách món ăn</h2>
            {!loading && !error && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {items.length} món
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => {
            setLoading(true);
            setError("");
            setReload((value) => value + 1);
          }} disabled={loading}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            {error ? "Thử lại" : "Làm mới"}
          </Button>
        </div>
        {loading && <p className="sr-only" role="status">Đang tải thực đơn...</p>}
        {!error && (
          <Table aria-label="Các món ăn của tôi">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className="pl-4">Món ăn</TableHead>
                <TableHead scope="col">Giá bán</TableHead>
                <TableHead scope="col">Trạng thái duyệt</TableHead>
                <TableHead scope="col">Trạng thái bán</TableHead>
                {canEdit && <TableHead scope="col" className="pr-4 text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 3 }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: canEdit ? 5 : 4 }, (_, cellIndex) => (
                    <TableCell key={cellIndex} className="px-4 py-3"><Skeleton className="h-8 w-full min-w-24" /></TableCell>
                  ))}
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={canEdit ? 5 : 4} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UtensilsIcon className="size-8" aria-hidden="true" />
                      <p className="font-medium text-foreground">Chưa có món ăn nào</p>
                      <p>Thực đơn đã gửi sẽ xuất hiện tại đây.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="py-3 pl-4">
                    <p className="max-w-72 truncate font-medium">{item.name}</p>
                    <p className="mt-1 line-clamp-2 max-w-72 whitespace-normal text-xs leading-5 text-muted-foreground">
                      {item.description || "Không có mô tả."}
                    </p>
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.price === null ? "Chưa có giá" : `${item.price.toLocaleString("vi-VN")} đ`}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.is_active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"}`}>
                      {item.is_active ? "Đã duyệt" : "Chờ duyệt"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {item.is_available ? "Đang bán" : "Tạm ngưng"}
                    </span>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="pr-4 text-right">
                      <Button nativeButton={false} role="link" variant="ghost" size="sm" aria-label={`Chỉnh sửa ${item.name}`} render={<Link to={`${item.id}/chinh-sua`} />}>
                        <PencilIcon aria-hidden="true" />
                        Chỉnh sửa
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
