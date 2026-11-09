import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  InboxIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
  UtensilsIcon,
} from "lucide-react";
import { Link } from "react-router";

import { DataPagination } from "#components/DataPagination";
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
import type { Pagination } from "../../../types/contract/Pagination";

const CURRENCY_FORMATTER = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function AdminPoiMenuSection({ poiId }: { poiId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<Pagination<MenuItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenuItems() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await menuItemService.listByPoi(
          poiId,
          page,
          undefined,
          controller.signal,
          pageSize,
        );
        if (!response.success || !response.data) throw new Error("Invalid response");
        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải danh sách thực đơn."),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadMenuItems();
    return () => controller.abort();
  }, [page, pageSize, poiId, requestVersion]);

  const items = data?.data ?? [];
  const menuPath = `/quan-ly/dia-diem-poi/${poiId}/mon-an`;

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UtensilsIcon className="size-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Danh sách thực đơn</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Các món ăn hiện đang được quản lý tại POI này.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link to={menuPath} />}>
            <SettingsIcon aria-hidden="true" />
            Quản lý thực đơn
          </Button>
          <Button render={<Link to={`${menuPath}/them`} />}>
            <PlusIcon aria-hidden="true" />
            Thêm món
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>Không thể tải thực đơn</AlertTitle>
            <AlertDescription>
              <p>{errorMessage}</p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => setRequestVersion((value) => value + 1)}
              >
                <RefreshCwIcon aria-hidden="true" />
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!errorMessage && (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Món ăn</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Kiểm duyệt</TableHead>
                <TableHead className="pr-4">Phục vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 3 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 5 }, (_, cell) => (
                      <TableCell key={cell}>
                        <Skeleton className="h-7 min-w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && items.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <InboxIcon className="size-7" aria-hidden="true" />
                      <p>POI chưa có món ăn nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                    <TableCell>
                      <p className="line-clamp-2 max-w-96 whitespace-normal text-sm text-muted-foreground">
                        {item.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {item.price == null ? "Liên hệ" : CURRENCY_FORMATTER.format(item.price)}
                    </TableCell>
                    <TableCell>{item.is_active ? "Đã duyệt" : "Chờ duyệt"}</TableCell>
                    <TableCell className="pr-4">
                      {item.is_available ? "Đang phục vụ" : "Tạm hết"}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          <DataPagination
            page={data?.page ?? page}
            pageSize={data?.page_size ?? pageSize}
            totalItems={data?.total_item ?? 0}
            totalPages={data?.total_page ?? 0}
            itemLabel="món ăn"
            disabled={loading}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPage(1);
              setPageSize(nextPageSize);
            }}
          />
        </>
      )}
    </section>
  );
}
