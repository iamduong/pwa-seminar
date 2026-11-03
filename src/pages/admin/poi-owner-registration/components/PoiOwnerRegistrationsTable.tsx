import { EyeIcon, InboxIcon } from "lucide-react";

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
import type { PoiOwnerRegistration } from "../../../../types/PoiOwnerRegistration";
import { PoiOwnerRegistrationStatusBadge } from "./PoiOwnerRegistrationStatusBadge";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

interface PoiOwnerRegistrationsTableProps {
  registrations: PoiOwnerRegistration[];
  loading: boolean;
  onViewRegistration: (registration: PoiOwnerRegistration) => void;
}

const COLUMN_COUNT = 6;

export function PoiOwnerRegistrationsTable({
  registrations,
  loading,
  onViewRegistration,
}: PoiOwnerRegistrationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">Doanh nghiệp</TableHead>
          <TableHead>Địa chỉ kinh doanh</TableHead>
          <TableHead>Ghi chú</TableHead>
          <TableHead>Ngày gửi</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="pr-4 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index}>
              <TableCell className="pl-4"><Skeleton className="h-8 w-40" /></TableCell>
              <TableCell><Skeleton className="h-8 w-52" /></TableCell>
              <TableCell><Skeleton className="h-8 w-40" /></TableCell>
              <TableCell><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell><Skeleton className="h-6 w-24" /></TableCell>
              <TableCell className="pr-4"><Skeleton className="ml-auto h-7 w-16" /></TableCell>
            </TableRow>
          ))}

        {!loading && registrations.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={COLUMN_COUNT} className="h-64 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <InboxIcon className="size-8" aria-hidden="true" />
                <p className="font-medium text-foreground">Không tìm thấy đơn đăng ký</p>
                <p>Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell className="pl-4">
                <div className="max-w-56">
                  <p className="truncate font-medium">{registration.business_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{registration.id}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="max-w-72 text-sm">{registration.business_address}</p>
              </TableCell>
              <TableCell>
                <p className="max-w-72 text-sm text-muted-foreground">
                  {registration.note.trim() || "—"}
                </p>
              </TableCell>
              <TableCell>{formatDateTime(registration.created_at)}</TableCell>
              <TableCell>
                <PoiOwnerRegistrationStatusBadge status={registration.status} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Xem đơn của ${registration.business_name}`}
                  onClick={() => onViewRegistration(registration)}
                >
                  <EyeIcon aria-hidden="true" />
                  Xem
                </Button>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
