import { InboxIcon, PencilIcon } from "lucide-react";
import { Link } from "react-router";
import { buttonVariants } from "#components/ui/button";
import { useAuthorize } from "../../../../hooks/use-authorize";

import { Skeleton } from "#components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/ui/table";

import type { AdminUser } from "../../../../types/AdminUser";

interface AdminUsersTableProps {
  users: AdminUser[];
  loading: boolean;
}


export function AdminUsersTable({
  users,
  loading,
}: AdminUsersTableProps) {
  const { session } = useAuthorize();
  const canEdit = session?.role?.permissions.includes("user:update") ?? false;
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Họ và tên</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Số điện thoại</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Xác minh chủ POI</TableHead>
          <TableHead>Vai trò</TableHead>
          <TableHead className="pr-4 text-right">ID người dùng</TableHead>
          {canEdit && <TableHead className="pr-4 text-right">Thao tác</TableHead>}
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading &&
          Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-4">
                <Skeleton className="h-5 w-36" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-44" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell className="pr-4">
                <Skeleton className="ml-auto h-5 w-24" />
              </TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              {canEdit && <TableCell className="pr-4"><Skeleton className="ml-auto h-7 w-20" /></TableCell>}
            </TableRow>
          ))}

        {!loading && users.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={canEdit ? 8 : 7}
              className="h-64 text-center"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <InboxIcon className="size-8" aria-hidden="true" />
                <p className="font-medium text-foreground">
                  Không tìm thấy người dùng
                </p>
                <p>Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="pl-4">
                <p className="max-w-48 truncate font-medium">
                  {user.full_name}
                </p>
              </TableCell>

              <TableCell>
                <p className="max-w-56 truncate text-sm">
                  {user.email}
                </p>
              </TableCell>

              <TableCell>{user.phone || "—"}</TableCell>

              <TableCell>
                <span
                className={
                user.is_active
                    ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                    : "inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
                }
                >
                {user.is_active ? "Hoạt động" : "Đã khóa"}
                </span>
              </TableCell>

              <TableCell>
                <span
                className={
                user.is_poi_owner_verified
                    ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                    : "inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                }
                >
                {user.is_poi_owner_verified
                ? "Đã xác minh"
                : "Chưa xác minh"}
                </span>
              </TableCell>

              <TableCell><span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{user.role_name || "—"}</span></TableCell>
              <TableCell className="pr-4 text-right">
                <span className="text-xs text-muted-foreground">
                  {user.id}
                </span>
              </TableCell>
              {canEdit && <TableCell className="pr-4 text-right">
                <Link className={buttonVariants({ variant: "outline", size: "sm" })} to={`/quan-ly/nguoi-dung/${user.id}/chinh-sua`} aria-label={`Sửa người dùng ${user.full_name}`}>
                  <PencilIcon aria-hidden="true" />Chỉnh sửa
                </Link>
              </TableCell>}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
