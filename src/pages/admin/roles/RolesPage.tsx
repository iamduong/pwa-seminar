import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { DataPagination } from "#components/DataPagination";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import { getApiErrorMessage } from "#lib/api";
import { roleService } from "../../../services/RoleService";
import type { Role, RolePagination } from "../../../types/Role";
import { RoleFilters } from "./components/RoleFilters";
import type { RoleStatusFilter } from "./components/RoleFilters";
import { RoleDetailDialog } from "./components/RoleDetailDialog";
import { RolesTable } from "./components/RolesTable";

const PAGE_SIZES = [20, 30, 50];

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default function RolesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const requestedPageSize = parsePositiveInteger(searchParams.get("page_size"), 20);
  const pageSize = PAGE_SIZES.includes(requestedPageSize) ? requestedPageSize : 20;
  const query = searchParams.get("q")?.slice(0, 100) ?? "";
  const roleStatus: RoleStatusFilter =
    searchParams.get("status") === "deleted" ? "deleted" : "active";
  const showDeleted = roleStatus === "deleted";

  const [data, setData] = useState<RolePagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToRestore, setRoleToRestore] = useState<Role | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoles() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await roleService.getRoles(
          { q: query, page, pageSize, isDeleted: showDeleted },
          controller.signal,
        );

        if (!response.success || !response.data) throw new Error("Invalid response");
        setData(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setData(null);
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải danh sách vai trò. Vui lòng thử lại."),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadRoles();
    return () => controller.abort();
  }, [page, pageSize, query, requestVersion, showDeleted]);

  function updatePagination(nextPage: number, nextPageSize = pageSize) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    nextParams.set("page_size", String(nextPageSize));
    setSearchParams(nextParams);
  }

  function applyQuery(nextQuery: string, nextStatus: RoleStatusFilter) {
    const nextParams = new URLSearchParams();
    nextParams.set("page", "1");
    nextParams.set("page_size", String(pageSize));
    nextParams.set("status", nextStatus);
    if (nextQuery) nextParams.set("q", nextQuery);
    setSearchParams(nextParams);
  }

  async function confirmRestore() {
    if (!roleToRestore) return;

    setRestoringId(roleToRestore.id);
    setErrorMessage(null);
    try {
      await roleService.restoreRole(roleToRestore.id);
      setRoleToRestore(null);
      setRequestVersion((version) => version + 1);
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể khôi phục vai trò. Vui lòng thử lại."),
      );
      setRoleToRestore(null);
    } finally {
      setRestoringId(null);
    }
  }

  async function confirmDelete() {
    if (!roleToDelete) return;

    setDeletingId(roleToDelete.id);
    setErrorMessage(null);
    try {
      await roleService.deleteRole(roleToDelete.id);
      setRoleToDelete(null);
      setRequestVersion((version) => version + 1);
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, "Không thể xóa vai trò. Vui lòng thử lại."));
      setRoleToDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Vai trò và quyền hạn</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thiết lập phạm vi truy cập cho từng nhóm người dùng.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setRequestVersion((version) => version + 1)}
          >
            <RefreshCwIcon className={loading ? "animate-spin" : undefined} aria-hidden="true" />
            Làm mới
          </Button>
          <Button render={<Link to="/quan-ly/quyen-han/them-vai-tro" />}>
            <PlusIcon aria-hidden="true" />
            Thêm vai trò
          </Button>
        </div>
      </header>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể thực hiện yêu cầu</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-labelledby="role-list-title">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <ShieldCheckIcon className="size-4" aria-hidden="true" />
          <h2 id="role-list-title" className="font-semibold">Danh sách vai trò</h2>
        </div>
        <RoleFilters
          key={`${query}:${roleStatus}`}
          initialQuery={query}
          initialStatus={roleStatus}
          loading={loading}
          onSubmit={applyQuery}
        />
        <RolesTable
          roles={data?.data ?? []}
          loading={loading}
          deletingId={deletingId}
          restoringId={restoringId}
          showDeleted={showDeleted}
          onView={setSelectedRole}
          onDelete={setRoleToDelete}
          onRestore={setRoleToRestore}
        />
        <DataPagination
          page={data?.page ?? page}
          pageSize={pageSize}
          totalItems={data?.total_item ?? 0}
          totalPages={data?.total_page ?? 0}
          itemLabel="vai trò"
          disabled={loading}
          onPageChange={(nextPage) => updatePagination(nextPage)}
          onPageSizeChange={(nextPageSize) => updatePagination(1, nextPageSize)}
        />
      </section>

      <RoleDetailDialog
        role={selectedRole}
        open={Boolean(selectedRole)}
        onOpenChange={(open) => !open && setSelectedRole(null)}
      />

      <Dialog
        open={Boolean(roleToRestore)}
        onOpenChange={(open) => !open && setRoleToRestore(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khôi phục vai trò</DialogTitle>
            <DialogDescription>
              Vai trò “{roleToRestore?.name}” sẽ xuất hiện trở lại trong danh sách
              đang hoạt động.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(restoringId)}
              onClick={() => setRoleToRestore(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={Boolean(restoringId)}
              onClick={() => void confirmRestore()}
            >
              {restoringId ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCwIcon aria-hidden="true" />
              )}
              {restoringId ? "Đang khôi phục..." : "Khôi phục vai trò"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(roleToDelete)} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa vai trò</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa vai trò “{roleToDelete?.name}”? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(deletingId)}
              onClick={() => setRoleToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={Boolean(deletingId)}
              onClick={() => void confirmDelete()}
            >
              {deletingId ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2Icon aria-hidden="true" />
              )}
              {deletingId ? "Đang xóa..." : "Xóa vai trò"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
