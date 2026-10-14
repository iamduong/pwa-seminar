import {
  CheckCircle2Icon,
  EyeIcon,
  PencilIcon,
  UserRoundXIcon,
  XCircleIcon,
} from "lucide-react"

import { Button } from "#components/ui/button"
import { Skeleton } from "#components/ui/skeleton"
import { Switch } from "#components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/ui/table"
import type { AdminUser } from "../../services/AdminUserService"

interface AdminUsersTableProps {
  users: AdminUser[]
  loading: boolean
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}

export function AdminUsersTable({ users, loading }: AdminUsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Người dùng</TableHead>
          <TableHead>Liên hệ</TableHead>
          <TableHead>Vai trò</TableHead>
          <TableHead>Chủ địa điểm</TableHead>
          <TableHead>Ngày tạo</TableHead>
          <TableHead>Hoạt động</TableHead>
          <TableHead className="pr-4 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-4"><Skeleton className="h-8 w-40" /></TableCell>
              <TableCell><Skeleton className="h-8 w-44" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="pr-4"><Skeleton className="ml-auto h-8 w-32" /></TableCell>
            </TableRow>
          ))}

        {!loading && users.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={7} className="h-64 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <UserRoundXIcon className="size-8" aria-hidden="true" />
                <p className="font-medium text-foreground">Không tìm thấy người dùng</p>
                <p>Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading && users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="pl-4">
              <div className="max-w-52">
                <p className="truncate font-medium">{user.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.id}</p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p>{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.phone}</p>
              </div>
            </TableCell>
            <TableCell>{user.role_name ?? "Chưa có vai trò"}</TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5">
                {user.is_poi_owner_verified ? (
                  <CheckCircle2Icon className="size-4" aria-hidden="true" />
                ) : (
                  <XCircleIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
                {user.is_poi_owner_verified ? "Đã xác minh" : "Chưa xác minh"}
              </span>
            </TableCell>
            <TableCell>{formatDate(user.created_at)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.is_active}
                  aria-label={`${user.is_active ? "Khóa" : "Kích hoạt"} tài khoản ${user.full_name}`}
                />
                <span className="text-xs text-muted-foreground">
                  {user.is_active ? "Đang bật" : "Đã khóa"}
                </span>
              </div>
            </TableCell>
            <TableCell className="pr-4">
              <div className="flex justify-end gap-1">
                <Button type="button" variant="ghost" size="sm" aria-label={`Xem ${user.full_name}`}>
                  <EyeIcon aria-hidden="true" />
                  Xem
                </Button>
                <Button type="button" variant="ghost" size="sm" aria-label={`Sửa ${user.full_name}`}>
                  <PencilIcon aria-hidden="true" />
                  Sửa
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
