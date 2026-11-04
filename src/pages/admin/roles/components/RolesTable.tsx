import {
  EyeIcon,
  InboxIcon,
  PencilIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { Link } from "react-router";

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
import type { Role } from "../../../../types/Role";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

interface RolesTableProps {
  roles: Role[];
  loading: boolean;
  deletingId: string | null;
  restoringId: string | null;
  showDeleted: boolean;
  onView: (role: Role) => void;
  onDelete: (role: Role) => void;
  onRestore: (role: Role) => void;
}

const COLUMN_COUNT = 6;

export function RolesTable({
  roles,
  loading,
  deletingId,
  restoringId,
  showDeleted,
  onView,
  onDelete,
  onRestore,
}: RolesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Vai trò</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>Số quyền</TableHead>
          <TableHead>Độ ưu tiên</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="pr-4 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-4"><Skeleton className="h-8 w-44" /></TableCell>
              <TableCell><Skeleton className="h-6 w-24" /></TableCell>
              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              <TableCell><Skeleton className="h-6 w-14" /></TableCell>
              <TableCell><Skeleton className="h-6 w-28" /></TableCell>
              <TableCell className="pr-4"><Skeleton className="ml-auto h-7 w-28" /></TableCell>
            </TableRow>
          ))}

        {!loading && roles.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={COLUMN_COUNT} className="h-64 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <InboxIcon className="size-8" aria-hidden="true" />
                <p className="font-medium text-foreground">Không tìm thấy vai trò</p>
                <p>Hãy thử thay đổi từ khóa hoặc tạo vai trò mới.</p>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                    <ShieldCheckIcon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-xs text-muted-foreground">{role.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium">
                  {role.is_system ? "Hệ thống" : "Tùy chỉnh"}
                </span>
              </TableCell>
              <TableCell>{role.permissions.length}</TableCell>
              <TableCell>{role.priority}</TableCell>
              <TableCell>
                {showDeleted ? (
                  <div>
                    <span className="inline-flex rounded-md border border-destructive/20 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                      Đã xóa
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {role.deleted_at ? formatDateTime(role.deleted_at) : "—"}
                    </p>
                  </div>
                ) : (
                  <span className="inline-flex rounded-md border bg-muted/50 px-2 py-1 text-xs font-medium">
                    Đang hoạt động
                  </span>
                )}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(role)}
                  >
                    <EyeIcon aria-hidden="true" />
                    Xem
                  </Button>
                  {showDeleted ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={restoringId === role.id}
                      onClick={() => onRestore(role)}
                    >
                      <RotateCcwIcon aria-hidden="true" />
                      Khôi phục
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link to={`/quan-ly/vai-tro/${role.id}/chinh-sua`} />}
                      >
                        <PencilIcon aria-hidden="true" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={role.is_system || deletingId === role.id}
                        aria-label={
                          role.is_system
                            ? `Không thể xóa vai trò hệ thống ${role.name}`
                            : `Xóa vai trò ${role.name}`
                        }
                        onClick={() => onDelete(role)}
                      >
                        <Trash2Icon aria-hidden="true" />
                        Xóa
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
