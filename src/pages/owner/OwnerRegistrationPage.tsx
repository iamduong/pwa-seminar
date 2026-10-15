import { type FormEvent, useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "#components/ui/field"
import { Input } from "#components/ui/input"
import { useAuth } from "#hooks/use-auth"
import { getApiErrorMessage } from "#lib/api"
import { ownerService, type OwnerRegistrationPayload } from "../../services/OwnerService"

type RegistrationErrors = Partial<Record<keyof OwnerRegistrationPayload, string>>
const idCardPattern = /^(?:\d{9}|\d{12})$/

export function OwnerRegistrationPage() {
  const { refreshProfile, user } = useAuth()
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [requestError, setRequestError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError("")

    const form = new FormData(event.currentTarget)
    const values: OwnerRegistrationPayload = {
      business_name: String(form.get("business_name") || "").trim(),
      business_address: String(form.get("business_address") || "").trim(),
      id_card: String(form.get("id_card") || "").trim().replace(/\s/g, ""),
    }
    const nextErrors: RegistrationErrors = {}
    if (values.business_name.length < 2) {
      nextErrors.business_name = "Vui lòng nhập tên doanh nghiệp hoặc hộ kinh doanh."
    }
    if (values.business_address.length < 5) {
      nextErrors.business_address = "Vui lòng nhập địa chỉ kinh doanh đầy đủ."
    }
    if (!idCardPattern.test(values.id_card)) {
      nextErrors.id_card = "CCCD/CMND phải gồm 9 hoặc 12 chữ số."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      setIsSubmitting(true)
      await ownerService.createRegistration(values)
      await refreshProfile()
    } catch (error) {
      setRequestError(
        getApiErrorMessage(error, "Không thể gửi hồ sơ đăng ký. Vui lòng thử lại."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const accountInformation = (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-semibold">Thông tin tài khoản</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Thông tin người đại diện được lấy từ tài khoản hiện tại.
      </p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 sm:col-span-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <UserRoundIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Họ và tên</dt>
            <dd className="truncate text-sm font-medium">{user?.fullName}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <MailIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="truncate text-sm font-medium">{user?.email}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <PhoneIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Số điện thoại</dt>
            <dd className="truncate text-sm font-medium">{user?.phone}</dd>
          </div>
        </div>
      </dl>
    </section>
  )

  if (user?.ownerSummary) {
    const statusConfig = {
      pending: {
        label: "Đang chờ duyệt",
        description: "Hồ sơ đang được quản trị viên kiểm tra.",
        icon: Clock3Icon,
        className: "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
      },
      approved: {
        label: "Đã được duyệt",
        description: "Bạn đã có thể truy cập Portal quản lý.",
        icon: CheckCircle2Icon,
        className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
      },
      rejected: {
        label: "Chưa được chấp thuận",
        description: "Vui lòng xem phản hồi từ quản trị viên.",
        icon: AlertCircleIcon,
        className: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
      },
    }[user.ownerSummary.status]
    const StatusIcon = statusConfig.icon

    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {accountInformation}
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-start gap-3 border-b border-black/5 p-5 dark:border-white/5">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${statusConfig.className}`}>
              <StatusIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold">{statusConfig.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{statusConfig.description}</p>
            </div>
          </div>
          <dl>
            <div className="border-b border-black/5 p-5 dark:border-white/5">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tên doanh nghiệp</dt>
              <dd className="mt-2 text-sm font-medium">{user.ownerSummary.business_name}</dd>
            </div>
            <div className="border-b border-black/5 p-5 dark:border-white/5">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Địa chỉ kinh doanh</dt>
              <dd className="mt-2 text-sm">{user.ownerSummary.business_address}</dd>
            </div>
            {user.ownerSummary.admin_note && (
              <div className="p-5">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Phản hồi quản trị viên</dt>
                <dd className="mt-2 text-sm">{user.ownerSummary.admin_note}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {accountInformation}
      <p className="mb-5 text-sm text-muted-foreground">
        Gửi thông tin doanh nghiệp để quản trị viên xác minh và cấp quyền quản lý.
      </p>

      <form className="mt-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6" onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {requestError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể gửi hồ sơ</AlertTitle>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          )}
          <Field data-invalid={Boolean(errors.business_name)}>
            <FieldLabel htmlFor="business_name">Tên doanh nghiệp hoặc hộ kinh doanh</FieldLabel>
            <Input id="business_name" name="business_name" autoComplete="organization" placeholder="Tên hiển thị trên hệ thống" aria-invalid={Boolean(errors.business_name)} disabled={isSubmitting} />
            <FieldError>{errors.business_name}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.business_address)}>
            <FieldLabel htmlFor="business_address">Địa chỉ kinh doanh</FieldLabel>
            <Input id="business_address" name="business_address" autoComplete="street-address" placeholder="Số nhà, tên đường, phường, quận" aria-invalid={Boolean(errors.business_address)} disabled={isSubmitting} />
            <FieldDescription>Địa chỉ này được dùng để xác minh hồ sơ và chưa tự động công khai.</FieldDescription>
            <FieldError>{errors.business_address}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.id_card)}>
            <FieldLabel htmlFor="id_card">Số CCCD/CMND</FieldLabel>
            <Input id="id_card" name="id_card" inputMode="numeric" autoComplete="off" placeholder="Nhập 9 hoặc 12 chữ số" aria-invalid={Boolean(errors.id_card)} disabled={isSubmitting} />
            <FieldDescription>Thông tin được mã hóa và chỉ sử dụng cho mục đích xác minh.</FieldDescription>
            <FieldError>{errors.id_card}</FieldError>
          </Field>
          <Button className="h-10 sm:self-end" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <SendIcon aria-hidden="true" />}
            {isSubmitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
