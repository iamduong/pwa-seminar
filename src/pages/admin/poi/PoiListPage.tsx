import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  EyeIcon,
  InboxIcon,
  MapIcon,
  MapPinnedIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  UtensilsIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import HybridMap from "#components/map/HybridMap";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
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
import { poiService } from "../../../services/PoiService";
import type { MapCoordinates } from "../../../components/map/lib/map-type";
import type { Poi, PoiAudioStatus, PoiPagination } from "../../../types/Poi";

const PAGE_SIZES = [20, 30, 50];
const AUDIO_STATUS_LABELS: Record<PoiAudioStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Xử lý lỗi",
};

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPoiCoordinates(poi: Poi): MapCoordinates | null {
  const [longitude, latitude] = poi.location.coordinates;
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) return null;
  return [longitude, latitude];
}

type SelectedPoi = {
  id: string;
  name: string;
  coordinates: MapCoordinates;
  radius: number;
};

export default function PoiListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = positiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const query = searchParams.get("q")?.slice(0, 100) ?? "";
  const created = searchParams.get("created");

  const [queryDraft, setQueryDraft] = useState(query);
  const [data, setData] = useState<PoiPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedPoi, setSelectedPoi] = useState<SelectedPoi | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPois() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await poiService.getAdminPois(
          { page, pageSize, q: query },
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error("Invalid response");
        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải danh sách POI."),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPois();
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
    params.delete("created");
    params.set("page", String(nextPage));
    params.set("page_size", String(nextPageSize));
    setSearchParams(params);
  }

  const pois = data?.data ?? [];

  function showPoiOnMap(poi: Poi) {
    const coordinates = getPoiCoordinates(poi);
    if (!coordinates) return;
    setSelectedPoi({
      id: poi.id,
      name: poi.name,
      coordinates,
      radius: poi.trigger_radius,
    });
    mapSectionRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản trị nội dung</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Danh sách POI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý địa điểm, trạng thái xử lý audio và thực đơn trên hệ thống.
          </p>
        </div>
        <Button render={<Link to="/quan-ly/dia-diem-poi/them-poi" />}>
          <PlusIcon aria-hidden="true" />
          Thêm POI trực tiếp
        </Button>
      </header>

      {created && (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>Đã tạo POI thành công</AlertTitle>
          <AlertDescription>
            POI đã được thêm trực tiếp và đang được xử lý bản dịch/audio. Mã POI: {created}
          </AlertDescription>
        </Alert>
      )}

      <div ref={mapSectionRef} className="scroll-mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPinnedIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Bản đồ POI</h2>
          </div>
          {selectedPoi && (
            <p className="max-w-64 truncate text-sm text-muted-foreground">
              Đang xem: {selectedPoi.name}
            </p>
          )}
        </div>
        <HybridMap
          className="h-120"
          selectedLocation={selectedPoi ? {
            location: selectedPoi.coordinates,
            radius: selectedPoi.radius,
            isFocus: true,
          } : undefined}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách POI</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              className="mt-3"
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRequestVersion((value) => value + 1)}
            >
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
            placeholder="Tìm theo tên hoặc địa chỉ..."
            aria-label="Tìm POI"
            onChange={(event) => setQueryDraft(event.target.value)}
          />
          <Button type="submit" disabled={loading}>
            <SearchIcon aria-hidden="true" />
            Tìm kiếm
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setRequestVersion((value) => value + 1)}
          >
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            Làm mới
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Địa điểm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>POI</TableHead>
              <TableHead>Audio</TableHead>
              <TableHead className="pr-4 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading &&
              Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }, (_, cell) => (
                    <TableCell key={cell}><Skeleton className="h-7 min-w-24" /></TableCell>
                  ))}
                </TableRow>
              ))}

            {!loading && !errorMessage && pois.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <InboxIcon className="size-8" aria-hidden="true" />
                    <p className="font-medium text-foreground">Chưa có POI</p>
                    <p>Thêm POI mới để bắt đầu quản lý địa điểm.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              pois.map((poi) => (
                <TableRow key={poi.id}>
                  <TableCell className="pl-4">
                    <p className="max-w-64 truncate font-medium">{poi.name}</p>
                    <p className="max-w-64 truncate text-xs text-muted-foreground">{poi.id}</p>
                  </TableCell>
                  <TableCell>{poi.category_name}</TableCell>
                  <TableCell>
                    <p className="line-clamp-2 max-w-80 whitespace-normal text-sm">{poi.address}</p>
                  </TableCell>
                  <TableCell>{poi.is_active ? "Đang hoạt động" : "Đang xử lý"}</TableCell>
                  <TableCell>{AUDIO_STATUS_LABELS[poi.audio_status]}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link to={`/quan-ly/dia-diem-poi/danh-sach-poi/${poi.id}`} />
                        }
                      >
                        <EyeIcon aria-hidden="true" />
                        Chi tiết
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!getPoiCoordinates(poi)}
                        onClick={() => showPoiOnMap(poi)}
                      >
                        <MapIcon aria-hidden="true" />
                        Bản đồ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link to={`/quan-ly/dia-diem-poi/${poi.id}/mon-an`} />}
                      >
                        <UtensilsIcon aria-hidden="true" />
                        Thực đơn
                      </Button>
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
          itemLabel="POI"
          disabled={loading}
          onPageChange={(nextPage) => updatePage(nextPage)}
          onPageSizeChange={(nextSize) => updatePage(1, nextSize)}
        />
      </section>
    </div>
  );
}
