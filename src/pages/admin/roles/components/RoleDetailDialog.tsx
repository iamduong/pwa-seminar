import { CalendarClockIcon, KeyRoundIcon, ShieldCheckIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import type { Role } from "../../../../types/Role";
import { getPermissionGroups } from "../permission-options";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

interface RoleDetailDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleDetailDialog({
  role,
  open,
  onOpenChange,
}: RoleDetailDialogProps) {
  const permissionGroups = role ? getPermissionGroups(role.permissions) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
              <ShieldCheckIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle>Chi tiết vai trò</DialogTitle>
              <DialogDescription className="mt-1">
                Thông tin và phạm vi quyền hạn được gán cho vai trò.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {role && (
          <div className="space-y-5">
            <dl className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Tên vai trò</dt>
                <dd className="mt-1 font-medium">{role.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Loại vai trò</dt>
                <dd className="mt-1">
                  <span className="inline-flex rounded-md border bg-background px-2 py-1 text-xs font-medium">
                    {role.is_system ? "Hệ thống" : "Tùy chỉnh"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Trạng thái</dt>
                <dd className="mt-1">
                  <span className="inline-flex rounded-md border bg-background px-2 py-1 text-xs font-medium">
                    {role.deleted_at ? "Đã xóa" : "Đang hoạt động"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Độ ưu tiên</dt>
                <dd className="mt-1 font-medium">{role.priority}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Mã vai trò</dt>
                <dd className="mt-1 break-all font-mono text-xs">{role.id}</dd>
              </div>
            </dl>

            <section aria-labelledby="role-permissions-title">
              <div className="mb-3 flex items-center gap-2">
                <KeyRoundIcon className="size-4" aria-hidden="true" />
                <h3 id="role-permissions-title" className="font-semibold">
                  Quyền hạn ({role.permissions.length})
                </h3>
              </div>

              {permissionGroups.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Vai trò này chưa được gán quyền hạn nào.
                </p>
              ) : (
                <div className="space-y-4">
                  {permissionGroups.map((group) => (
                    <div key={group.title}>
                      <p className="mb-2 text-sm font-medium">{group.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.permissions.map((permission) => (
                          <span
                            key={permission.value}
                            className="inline-flex rounded-md border bg-muted/40 px-2 py-1 text-xs"
                            title={permission.value}
                          >
                            {permission.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <dl className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <CalendarClockIcon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted-foreground">Ngày tạo</dt>
                  <dd className="mt-0.5">{formatDateTime(role.created_at)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarClockIcon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted-foreground">Cập nhật lần cuối</dt>
                  <dd className="mt-0.5">{formatDateTime(role.updated_at)}</dd>
                </div>
              </div>
              {role.deleted_at && (
                <div className="flex items-start gap-2">
                  <CalendarClockIcon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Thời điểm xóa</dt>
                    <dd className="mt-0.5">{formatDateTime(role.deleted_at)}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
