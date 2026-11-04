import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  InboxIcon,
  MapIcon,
  MapPinnedIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import HybridMap from "#components/map/HybridMap";
import type { MapCoordinates } from "../../../components/map/lib/map-type";
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
import { useAuthorize } from "../../../providers/AuthorizeProvider";
import { poiService } from "../../../services/PoiService";
import type { Poi, PoiAudioStatus, PoiPagination } from "../../../types/Poi";

const PAGE_SIZES = [20, 30, 50];

const AUDIO_STATUS_LABELS: Record<PoiAudioStatus, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  ready: "Sẵn sàng",
  failed: "Xử lý lỗi",
};

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPoiCoordinates(poi: Poi): MapCoordinates | null {
  const [longitude, latitude] = poi.location.coordinates;
  if (
    typeof longitude !== "number" ||
    typeof latitude !== "number" ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return [longitude, latitude];
}

type SelectedPoi = {
  id: string;
  name: string;
  coordinates: MapCoordinates;
  radius: number;
};

export default function PoiSubmissionPage() {
  const { session } = useAuthorize();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = parsePositiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const query = searchParams.get("q")?.slice(0, 100) ?? "";

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
        const response = await poiService.getMyPois(
          { page, pageSize, q: query },
          controller.signal,
        );
        if (!response.success || !response.data) throw new Error("Invalid response");
        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải danh sách POI. Vui lòng thử lại."),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPois();
    return () => controller.abort();
  }, [page, pageSize, query, requestVersion]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextParams = new URLSearchParams();
    nextParams.set("page", "1");
    nextParams.set("page_size", String(pageSize));
    if (queryDraft.trim()) nextParams.set("q", queryDraft.trim());
    setSearchParams(nextParams);
  }

  function updatePagination(nextPage: number, nextPageSize = pageSize) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    nextParams.set("page_size", String(nextPageSize));
    setSearchParams(nextParams);
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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mapSectionRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Chức năng chủ quán</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">POI của tôi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi các địa điểm đã được phê duyệt thuộc quyền quản lý của bạn.
          </p>
        </div>
        {session?.role?.permissions.includes("owner:poi_submit") && (
          <Button render={<Link to="/quan-ly/chu-quan/gui-yeu-cau-them-poi" />}>
            <PlusIcon aria-hidden="true" />
            Đăng ký địa điểm mới
          </Button>
        )}
      </header>

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
          selectedLocation={selectedPoi?.coordinates ?? null}
          selectedRadius={selectedPoi?.radius ?? null}
          focusSelectedLocation
          showGeolocation={false}
        />
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách POI</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              type="button"
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => setRequestVersion((version) => version + 1)}
            >
              <RefreshCwIcon aria-hidden="true" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MapPinnedIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Danh sách POI</h2>
          </div>

          <form className="flex flex-col gap-3 border-b p-4 sm:flex-row" onSubmit={applyFilters}>
            <Input
              value={queryDraft}
              maxLength={100}
              placeholder="Tìm theo tên hoặc địa chỉ..."
              aria-label="Tìm POI theo tên hoặc địa chỉ"
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
              onClick={() => setRequestVersion((version) => version + 1)}
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
                <TableHead className="w-80">Địa chỉ</TableHead>
                <TableHead>Trạng thái POI</TableHead>
                <TableHead>Âm thanh</TableHead>
                <TableHead className="pr-4 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 6 }, (_, cellIndex) => (
                      <TableCell key={cellIndex}><Skeleton className="h-7 w-full min-w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && pois.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <InboxIcon className="size-8" aria-hidden="true" />
                      <p className="font-medium text-foreground">Chưa có POI</p>
                      <p>POI được duyệt sẽ xuất hiện tại đây.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                pois.map((poi) => {
                  const coordinates = getPoiCoordinates(poi);

                  return (
                    <TableRow
                      key={poi.id}
                      data-state={selectedPoi?.id === poi.id ? "selected" : undefined}
                    >
                      <TableCell className="pl-4">
                        <p className="max-w-56 truncate font-medium">{poi.name}</p>
                        <p className="max-w-56 truncate text-xs text-muted-foreground">{poi.id}</p>
                      </TableCell>
                      <TableCell>{poi.category_name}</TableCell>
                      <TableCell>
                        <p className="line-clamp-2 max-w-80 whitespace-normal text-sm leading-5">
                          {poi.address}
                        </p>
                      </TableCell>
                      <TableCell>
                        {poi.is_active ? "Đang hoạt động" : "Chưa hoạt động"}
                      </TableCell>
                      <TableCell>{AUDIO_STATUS_LABELS[poi.audio_status]}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!coordinates}
                          onClick={() => showPoiOnMap(poi)}
                        >
                          <MapIcon aria-hidden="true" />
                          Bản đồ
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>

          <DataPagination
            page={data?.page ?? page}
            pageSize={pageSize}
            totalItems={data?.total_item ?? 0}
            totalPages={data?.total_page ?? 0}
            itemLabel="POI"
            disabled={loading}
            onPageChange={(nextPage) => updatePagination(nextPage)}
            onPageSizeChange={(nextPageSize) => updatePagination(1, nextPageSize)}
          />
        </section>
      )}
    </div>
  );
}
