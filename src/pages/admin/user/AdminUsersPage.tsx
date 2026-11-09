import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  FileTextIcon,
  RefreshCwIcon,
  UserPlusIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "#components/ui/alert";
import { Button, buttonVariants } from "#components/ui/button";
import { useAuthorize } from "../../../hooks/use-authorize";
import { getApiErrorMessage } from "#lib/api";

import { adminUserService } from "../../../services/AdminUserService";
import type {
  AdminUserPagination,
  FilterAdminUser,
} from "../../../types/AdminUser";

import {
  AdminUserFilters,
  type AdminUserFilterDraft,
  type BooleanFilterValue,
} from "./components/AdminUserFilters";
import { AdminUsersTable } from "./components/AdminUsersTable";

const PAGE_SIZES = [20, 30, 50];

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBooleanFilter(
  value: string | null,
): BooleanFilterValue {
  if (value === "true" || value === "false") {
    return value;
  }

  return "all";
}

export default function AdminUsersPage() {
  const { session } = useAuthorize();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const requestedPageSize = parsePositiveInteger(
    searchParams.get("page_size"),
    20,
  );

  const pageSize = PAGE_SIZES.includes(requestedPageSize)
    ? requestedPageSize
    : 20;

  const query = searchParams.get("q")?.slice(0, 100) ?? "";

  const isActive = parseBooleanFilter(
    searchParams.get("is_active"),
  );

  const isPoiOwnerVerified = parseBooleanFilter(
    searchParams.get("is_poi_owner_verified"),
  );

  const [data, setData] = useState<AdminUserPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const params: FilterAdminUser = {
          page,
          page_size: pageSize,
          q: query || undefined,
          is_active:
            isActive === "all" ? undefined : isActive === "true",
          is_poi_owner_verified:
            isPoiOwnerVerified === "all"
              ? undefined
              : isPoiOwnerVerified === "true",
        };

        const response = await adminUserService.PaginationAdminUser(
          params,
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
              "Không thể tải danh sách người dùng. Vui lòng thử lại.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => controller.abort();
  }, [
    page,
    pageSize,
    query,
    isActive,
    isPoiOwnerVerified,
    requestVersion,
  ]);

  function updatePagination(nextPage: number, nextPageSize = pageSize) {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("page", String(nextPage));
    nextParams.set("page_size", String(nextPageSize));

    setSearchParams(nextParams);
  }

  function applyFilters(draft: AdminUserFilterDraft) {
    const nextParams = new URLSearchParams();

    nextParams.set("page", "1");
    nextParams.set("page_size", String(pageSize));

    if (draft.query) {
      nextParams.set("q", draft.query);
    }

    if (draft.isActive !== "all") {
      nextParams.set("is_active", draft.isActive);
    }

    if (draft.isPoiOwnerVerified !== "all") {
      nextParams.set(
        "is_poi_owner_verified",
        draft.isPoiOwnerVerified,
      );
    }

    setSearchParams(nextParams);
  }

  const users = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Quản trị hệ thống
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Quản lý người dùng
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi thông tin, trạng thái tài khoản và xác minh chủ POI.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
        {session?.role?.permissions.includes("user:create") && <Link className={buttonVariants()} to="/quan-ly/nguoi-dung/them-nguoi-dung"><UserPlusIcon aria-hidden="true" />Thêm người dùng</Link>}
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
        </div>
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
          aria-labelledby="admin-users-list-title"
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <FileTextIcon className="size-4" aria-hidden="true" />

            <h2
              id="admin-users-list-title"
              className="font-semibold"
            >
              Danh sách người dùng
            </h2>
          </div>

          <AdminUserFilters
            key={`${query}:${isActive}:${isPoiOwnerVerified}`}
            initialValue={{
              query,
              isActive,
              isPoiOwnerVerified,
            }}
            loading={loading}
            onSubmit={applyFilters}
          />

          <AdminUsersTable
            users={users}
            loading={loading}
          />

          <DataPagination
            page={data?.page ?? page}
            pageSize={pageSize}
            totalItems={data?.total_item ?? 0}
            totalPages={data?.total_page ?? 0}
            itemLabel="người dùng"
            disabled={loading}
            onPageChange={(nextPage) => updatePagination(nextPage)}
            onPageSizeChange={(nextPageSize) =>
              updatePagination(1, nextPageSize)
            }
          />
        </section>
      )}
    </div>
  );
}
