import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react"
import { Navigate } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { useAuth } from "#hooks/use-auth"
import { useOwnerRegistration } from "#hooks/use-owner-registration"

const statusConfig = {
  pending: {
    label: "Đang chờ duyệt",
    description: "Hồ sơ đang được quản trị viên kiểm tra.",
    icon: Clock3Icon,
  },
  approved: {
    label: "Đã được duyệt",
    description: "Hồ sơ đã được chấp thuận.",
    icon: CheckCircle2Icon,
  },
  rejected: {
    label: "Cần bổ sung thông tin",
    description: "Hồ sơ chưa được chấp thuận. Vui lòng xem phản hồi bên dưới.",
    icon: AlertCircleIcon,
  },
} as const

export function RegistrationStatusPage() {
  const { user } = useAuth()
  const { errorMessage, registration, reload, status } = useOwnerRegistration()

  if (user?.isPoiOwnerVerified) {
    return <Navigate to="/dashboard" replace />
  }

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
          Đang tải trạng thái hồ sơ...
        </div>
      </div>
    )
  }

  if (status === "error" || !registration) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>Không thể tải hồ sơ đăng ký</AlertTitle>
        <AlertDescription>
          <p>{errorMessage ?? "Không tìm thấy thông tin hồ sơ."}</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => void reload()}>
            <RefreshCwIcon aria-hidden="true" />
            Thử lại
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const config = statusConfig[registration.status]
  const StatusIcon = config.icon

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">Hồ sơ đối tác</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Trạng thái đăng ký</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Theo dõi kết quả xét duyệt tài khoản và thông tin doanh nghiệp của bạn.
        </p>
      </header>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-start gap-3 border-b p-5 sm:p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <StatusIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">{config.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>

        <dl className="grid gap-0 sm:grid-cols-2">
          <div className="border-b p-5 sm:border-r sm:p-6">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Người đại diện
            </dt>
            <dd className="mt-2 text-sm font-medium">{user?.fullName}</dd>
          </div>
          <div className="border-b p-5 sm:p-6">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Số điện thoại
            </dt>
            <dd className="mt-2 text-sm font-medium">{user?.phone}</dd>
          </div>
          <div className="border-b p-5 sm:border-r sm:p-6">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Tên doanh nghiệp
            </dt>
            <dd className="mt-2 text-sm font-medium">{registration.business_name}</dd>
          </div>
          <div className="border-b p-5 sm:p-6">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Mã hồ sơ
            </dt>
            <dd className="mt-2 break-all text-sm font-medium">{registration.registration_id}</dd>
          </div>
          <div className="p-5 sm:col-span-2 sm:p-6">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Địa chỉ kinh doanh
            </dt>
            <dd className="mt-2 text-sm leading-6">{registration.business_address}</dd>
          </div>
        </dl>
      </section>

      {registration.status === "rejected" && (
        <Alert className="mt-5" variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Phản hồi từ quản trị viên</AlertTitle>
          <AlertDescription>
            {registration.admin_note || "Quản trị viên chưa cung cấp lý do cụ thể."}
          </AlertDescription>
        </Alert>
      )}

      {registration.status === "pending" && (
        <Alert className="mt-5">
          <Clock3Icon aria-hidden="true" />
          <AlertTitle>Hồ sơ đang được xử lý</AlertTitle>
          <AlertDescription>
            Các chức năng quản lý địa điểm sẽ được mở sau khi hồ sơ được phê duyệt.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
