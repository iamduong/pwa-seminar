import { AlertCircleIcon, InboxIcon, RefreshCwIcon, SearchIcon, UtensilsIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Skeleton } from "#components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "#components/ui/table";
import { useAuthorize } from "#hooks/use-authorize";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { AdminPoi } from "../../../types/MenuItem";
import type { Pagination } from "../../../types/contract/Pagination";

const PAGE_SIZES = [20, 30, 50];

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default function MenuPoiListPage() {
  const { session } = useAuthorize();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = positiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const query = searchParams.get("q")?.slice(0, 100) ?? "";
  const [queryDraft, setQueryDraft] = useState(query);
  const [data, setData] = useState<Pagination<AdminPoi> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const canCreate = session?.role?.permissions.includes("menu:create") ?? false;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await menuItemService.listPois(page, pageSize, query, controller.signal);
        if (!response.success || !response.data) throw new Error(response.message);
        if (!controller.signal.aborted) setData(response.data);
      } catch (requestError: unknown) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError, "Không thể tải danh sách địa điểm."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [page, pageSize, query, requestVersion]);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("page_size", String(pageSize));
    if (queryDraft.trim()) params.set("q", queryDraft.trim());
    setSearchParams(params);
  }

  function updatePage(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    params.set("page_size", String(nextPageSize));
    setSearchParams(params);
  }

  const pois = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Quản trị nội dung</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Danh sách thực đơn</h1>
        <p className="mt-2 text-sm text-muted-foreground">Chọn một địa điểm để xem và quản lý các món ăn.</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách địa điểm</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <Button className="mt-3" type="button" size="sm" variant="outline" onClick={() => setRequestVersion((value) => value + 1)}>
              <RefreshCwIcon aria-hidden="true" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <form className="flex flex-col gap-3 border-b p-4 sm:flex-row" onSubmit={applyFilter}>
          <Input
            value={queryDraft}
            maxLength={100}
            placeholder="Tìm theo tên hoặc địa chỉ POI..."
            aria-label="Tìm địa điểm để quản lý thực đơn"
            onChange={(event) => setQueryDraft(event.target.value)}
          />
          <Button type="submit" disabled={loading}>
            <SearchIcon aria-hidden="true" />
            Tìm kiếm
          </Button>
          <Button type="button" variant="outline" disabled={loading} onClick={() => setRequestVersion((value) => value + 1)}>
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            Làm mới
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Địa điểm</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead className="pr-4 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                <TableCell className="pl-4"><Skeleton className="h-6 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-full max-w-96" /></TableCell>
                <TableCell className="pr-4"><Skeleton className="ml-auto h-8 w-32" /></TableCell>
              </TableRow>
            ))}
            {!loading && pois.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="size-8" aria-hidden="true" />
                    <p className="font-medium text-foreground">Không tìm thấy địa điểm</p>
                    <p>Hãy thử thay đổi từ khóa tìm kiếm.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && pois.map((poi) => (
              <TableRow key={poi.id}>
                <TableCell className="pl-4 font-medium">{poi.name}</TableCell>
                <TableCell className="max-w-xl whitespace-normal text-sm text-muted-foreground">{poi.address}</TableCell>
                <TableCell className="pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" render={<Link to={`/quan-ly/dia-diem-poi/${poi.id}/mon-an`} />}>
                      <UtensilsIcon aria-hidden="true" />
                      Xem thực đơn
                    </Button>
                    {canCreate && (
                      <Button size="sm" render={<Link to={`/quan-ly/dia-diem-poi/${poi.id}/mon-an/them`} />}>
                        Thêm món
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <DataPagination
          page={data?.page ?? page}
          pageSize={pageSize}
          totalItems={data?.total_item ?? 0}
          totalPages={data?.total_page ?? 0}
          itemLabel="địa điểm"
          disabled={loading}
          onPageChange={(nextPage) => updatePage(nextPage)}
          onPageSizeChange={(nextSize) => updatePage(1, nextSize)}
        />
      </section>
    </div>
  );
}
