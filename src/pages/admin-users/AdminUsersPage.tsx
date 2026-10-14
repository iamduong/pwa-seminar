import { useEffect, useState } from "react"
import { AlertCircleIcon, PlusIcon, RefreshCwIcon, UsersIcon } from "lucide-react"
import { useSearchParams } from "react-router"

import { DataPagination } from "#components/DataPagination"
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { getApiErrorMessage } from "#lib/api"
import {
  adminUserService,
  type AdminUserPagination,
} from "../../services/AdminUserService"
import {
  AdminUserFilters,
  type AdminUserFilterDraft,
  type BooleanFilterValue,
} from "./AdminUserFilters"
import { AdminUsersTable } from "./AdminUsersTable"

const PAGE_SIZES = [20, 30, 50]

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseBooleanFilter(value: string | null): BooleanFilterValue {
  return value === "true" || value === "false" ? value : "all"
}

function toBoolean(value: BooleanFilterValue) {
  return value === "all" ? undefined : value === "true"
}

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePositiveInteger(searchParams.get("page"), 1)
  const requestedPageSize = parsePositiveInteger(searchParams.get("page_size"), 20)
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20
  const query = searchParams.get("q")?.slice(0, 100) ?? ""
  const active = parseBooleanFilter(searchParams.get("is_active"))
  const verified = parseBooleanFilter(searchParams.get("is_poi_owner_verified"))

  const [data, setData] = useState<AdminUserPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadUsers() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const response = await adminUserService.getAdminUsers(
          {
            page,
            page_size: pageSize,
            q: query.trim() || undefined,
            is_active: toBoolean(active),
            is_poi_owner_verified: toBoolean(verified),
          },
          controller.signal,
        )

        if (!response.success || !response.data) {
          throw new Error("Invalid response")
        }

        setData(response.data)
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null)
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải danh sách người dùng. Vui lòng thử lại."),
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadUsers()
    return () => controller.abort()
  }, [page, pageSize, query, active, verified, requestVersion])

  function updatePagination(nextPage: number, nextPageSize = pageSize) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", String(nextPage))
    nextParams.set("page_size", String(nextPageSize))
    setSearchParams(nextParams)
  }

  function applyFilters(draft: AdminUserFilterDraft) {
    const nextParams = new URLSearchParams()
    nextParams.set("page", "1")
    nextParams.set("page_size", String(pageSize))

    const normalizedQuery = draft.query.trim()
    if (normalizedQuery) nextParams.set("q", normalizedQuery)
    if (draft.active !== "all") nextParams.set("is_active", draft.active)
    if (draft.verified !== "all") {
      nextParams.set("is_poi_owner_verified", draft.verified)
    }

    setSearchParams(nextParams)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Quản lý người dùng</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Theo dõi tài khoản, vai trò và trạng thái xác minh của người dùng.
          </p>
        </div>
        <Button type="button" className="w-fit">
          <PlusIcon aria-hidden="true" />
          Thêm người dùng
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
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="user-list-title">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <UsersIcon className="size-4" aria-hidden="true" />
            <h2 id="user-list-title" className="font-semibold">Danh sách người dùng</h2>
          </div>

          <AdminUserFilters
            key={`${query}:${active}:${verified}`}
            initialValue={{ query, active, verified }}
            loading={loading}
            onSubmit={applyFilters}
          />
          <AdminUsersTable users={data?.items ?? []} loading={loading} />
          <DataPagination
            page={data?.page ?? page}
            pageSize={pageSize}
            totalItems={data?.total_items ?? 0}
            totalPages={data?.total_pages ?? 0}
            disabled={loading}
            onPageChange={(nextPage) => updatePagination(nextPage)}
            onPageSizeChange={(nextPageSize) => updatePagination(1, nextPageSize)}
          />
        </section>
      )}
    </div>
  )
}
