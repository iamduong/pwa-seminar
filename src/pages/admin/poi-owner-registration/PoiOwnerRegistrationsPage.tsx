import { useEffect, useState } from "react";
import { AlertCircleIcon, FileTextIcon, RefreshCwIcon } from "lucide-react";
import { useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { getApiErrorMessage } from "#lib/api";
import { poiOwnerRegistrationService } from "../../../services/PoiOwnerRegistrationService";
import type {
  PoiOwnerRegistration,
  PoiOwnerRegistrationPagination,
} from "../../../types/PoiOwnerRegistration";
import {
  PoiOwnerRegistrationFilters,
  type PoiOwnerRegistrationFilterDraft,
  type StatusFilterValue,
} from "./components/PoiOwnerRegistrationFilters";
import { PoiOwnerRegistrationsTable } from "./components/PoiOwnerRegistrationsTable";
import PoiOwnerRegistrationDetailPage from "./PoiOwnerRegistrationDetailPage";

const PAGE_SIZES = [20, 30, 50];
const DEFAULT_STATUS: StatusFilterValue = "pending";

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStatus(value: string | null): StatusFilterValue {
  if (value === "all") return "all";
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  return DEFAULT_STATUS;
}

export default function PoiOwnerRegistrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = parsePositiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const query = searchParams.get("q")?.slice(0, 100) ?? "";
  const status = parseStatus(searchParams.get("status"));

  const [data, setData] = useState<PoiOwnerRegistrationPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedRegistration, setSelectedRegistration] =
    useState<PoiOwnerRegistration | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRegistrations() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await poiOwnerRegistrationService.PaginationPoiOwnerRegistration(
          {
            q: query,
            page,
            pageSize,
            status: status === "all" ? undefined : status,
          },
          controller.signal,
        );

        if (!response.success || !response.data) {
          throw new Error("Invalid response");
        }

        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Không thể tải danh sách đơn đăng ký. Vui lòng thử lại.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadRegistrations();
    return () => controller.abort();
  }, [page, pageSize, query, status, requestVersion]);

  function updatePagination(nextPage: number, nextPageSize = pageSize) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    nextParams.set("page_size", String(nextPageSize));
    setSearchParams(nextParams);
  }

  function applyFilters(draft: PoiOwnerRegistrationFilterDraft) {
    const nextParams = new URLSearchParams();
    nextParams.set("page", "1");
    nextParams.set("page_size", String(pageSize));
    nextParams.set("status", draft.status);
    if (draft.query) nextParams.set("q", draft.query);

    setSearchParams(nextParams);
  }

  function viewRegistration(registration: PoiOwnerRegistration) {
    setSelectedRegistration(registration);
    setDetailOpen(true);
  }

  async function reviewRegistration({
    status,
    adminNote,
  }: {
    status: "approved" | "rejected";
    adminNote: string;
  }) {
    if (!selectedRegistration) return;

    await poiOwnerRegistrationService.ReviewPoiOwnerRegistration(
      selectedRegistration.id,
      { status, admin_note: adminNote || undefined },
    );
    setDetailOpen(false);
    setSelectedRegistration(null);
    setRequestVersion((version) => version + 1);
  }

  const registrations = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Đơn đăng ký chủ quán
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi và xử lý hồ sơ đăng ký quyền chủ địa điểm.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={loading}
          onClick={() => setRequestVersion((version) => version + 1)}
        >
          <RefreshCwIcon
            className={loading ? "animate-spin" : undefined}
            aria-hidden="true"
          />
          Làm mới
        </Button>
      </header>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải danh sách</AlertTitle>
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
        <section
          className="overflow-hidden rounded-xl border bg-card shadow-sm"
          aria-labelledby="registration-list-title"
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <FileTextIcon className="size-4" aria-hidden="true" />
            <h2 id="registration-list-title" className="font-semibold">
              Danh sách đơn đăng ký
            </h2>
          </div>

          <PoiOwnerRegistrationFilters
            key={`${query}:${status}`}
            initialValue={{ query, status }}
            loading={loading}
            onSubmit={applyFilters}
          />
          <PoiOwnerRegistrationsTable
            registrations={registrations}
            loading={loading}
            onViewRegistration={viewRegistration}
          />
          <DataPagination
            page={data?.page ?? page}
            pageSize={pageSize}
            totalItems={data?.total_item ?? 0}
            totalPages={data?.total_page ?? 0}
            itemLabel="đơn đăng ký"
            disabled={loading}
            onPageChange={(nextPage) => updatePagination(nextPage)}
            onPageSizeChange={(nextPageSize) => updatePagination(1, nextPageSize)}
          />
        </section>
      )}

      <PoiOwnerRegistrationDetailPage
        registration={selectedRegistration}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onReview={reviewRegistration}
      />
    </div>
  );
}
