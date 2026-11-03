import type { ReactNode } from "react";

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

interface PoiOwnerRegistrationDetailProps {
  registration: PoiOwnerRegistration;
}

interface DetailFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

function DetailField({ label, children, className }: DetailFieldProps) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm break-words">{children}</dd>
    </div>
  );
}

export function PoiOwnerRegistrationDetail({
  registration,
}: PoiOwnerRegistrationDetailProps) {
  return (
    <section className="space-y-3" aria-labelledby="registration-detail-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="registration-detail-title" className="font-semibold">
          Thông tin hồ sơ
        </h3>
        <PoiOwnerRegistrationStatusBadge status={registration.status} />
      </div>

      <dl className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
        <DetailField label="Tên doanh nghiệp" className="sm:col-span-2">
          {registration.business_name}
        </DetailField>
        <DetailField label="Địa chỉ kinh doanh" className="sm:col-span-2">
          {registration.business_address}
        </DetailField>
        <DetailField label="Ghi chú của người đăng ký" className="sm:col-span-2">
          {registration.note.trim() || "—"}
        </DetailField>
        {registration.admin_note && (
          <DetailField label="Phản hồi của quản trị viên" className="sm:col-span-2">
            {registration.admin_note}
          </DetailField>
        )}
        <DetailField label="Ngày gửi">
          {formatDateTime(registration.created_at)}
        </DetailField>
        <DetailField label="Cập nhật gần nhất">
          {formatDateTime(registration.updated_at)}
        </DetailField>
        <DetailField label="Mã đơn" className="sm:col-span-2">
          <span className="font-mono text-xs">{registration.id}</span>
        </DetailField>
      </dl>
    </section>
  );
}
