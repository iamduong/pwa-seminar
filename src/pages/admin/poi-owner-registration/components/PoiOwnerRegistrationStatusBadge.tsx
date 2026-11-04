import {
  CheckCircle2Icon,
  Clock3Icon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react";

import type { PoiOwnerRegistrationStatus } from "../../../../types/PoiOwnerRegistration";

interface StatusMeta {
  label: string;
  className: string;
  icon: LucideIcon;
}

const STATUS_META: Record<PoiOwnerRegistrationStatus, StatusMeta> = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
    icon: Clock3Icon,
  },
  approved: {
    label: "Đã duyệt",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300",
    icon: CheckCircle2Icon,
  },
  rejected: {
    label: "Từ chối",
    className: "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300",
    icon: XCircleIcon,
  },
};

interface PoiOwnerRegistrationStatusBadgeProps {
  status: PoiOwnerRegistrationStatus;
}

export function PoiOwnerRegistrationStatusBadge({
  status,
}: PoiOwnerRegistrationStatusBadgeProps) {
  const { label, className, icon: StatusIcon } = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <StatusIcon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
