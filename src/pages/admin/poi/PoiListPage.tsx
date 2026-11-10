import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertCircleIcon, InboxIcon, MapPinIcon, RefreshCwIcon, UtensilsIcon } from "lucide-react";
import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button, buttonVariants } from "#components/ui/button";
import { Skeleton } from "#components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";
import { menuItemService } from "../../../services/MenuItemService";
import type { AdminPoi } from "../../../types/MenuItem";
import { getApiErrorMessage } from "#lib/api";

export default function PoiListPage() {
  const [items, setItems] = useState<AdminPoi[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [requestVersion, setRequestVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await menuItemService.listPois(page, pageSize);
        if (!response.success || !response.data) {
          throw new Error("Không có dữ liệu");
        }

        if (active) {
          setItems(response.data.data);
          setTotalPages(response.data.total_page);
          setTotalItems(response.data.total_item);
        }
      } catch (error) {
        if (active) {
          setItems([]);
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
  }, [page, pageSize, requestVersion]);

  function refresh() {
    setRequestVersion((version) => version + 1);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản lý địa điểm POI</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Danh sách POI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi địa điểm, địa chỉ và danh sách món ăn tại từng POI.
          </p>
        </div>
        <Button type="button" variant="outline" className="w-fit" disabled={loading} onClick={refresh}>
          <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
          Làm mới
        </Button>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <Button type="button" className="mt-3" size="sm" variant="outline" onClick={refresh}>
              <RefreshCwIcon aria-hidden="true" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="poi-list-title" aria-busy={loading}>
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MapPinIcon className="size-4" aria-hidden="true" />
            <h2 id="poi-list-title" className="font-semibold">Danh sách địa điểm</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Tên địa điểm</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead className="pr-4 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell className="py-4 pl-4"><Skeleton className="h-5 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-56" /></TableCell>
                  <TableCell className="pr-4"><Skeleton className="ml-auto h-7 w-28" /></TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <InboxIcon className="size-8" aria-hidden="true" />
                      <p className="font-medium text-foreground">Chưa có địa điểm POI</p>
                      <p>Các địa điểm sẽ hiển thị tại đây khi có dữ liệu.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && items.map((poi) => (
                <TableRow key={poi.id}>
                  <TableCell className="min-w-48 py-4 pl-4 font-medium whitespace-normal">{poi.name}</TableCell>
                  <TableCell className="min-w-56 max-w-md whitespace-normal text-muted-foreground">{poi.address || "—"}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <Link
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      to={`/quan-ly/dia-diem-poi/${poi.id}/mon-an`}
                      aria-label={`Xem món ăn tại ${poi.name}`}
                    >
                      <UtensilsIcon aria-hidden="true" />
                      Xem món ăn
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataPagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            itemLabel="địa điểm"
            disabled={loading}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </section>
      )}
    </div>
  );
}
