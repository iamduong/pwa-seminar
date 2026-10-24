import { type FormEvent, useState } from "react"
import {
  BriefcaseBusinessIcon,
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#components/ui/field"
import { Input } from "#components/ui/input"
import { Textarea } from "#components/ui/textarea"
import { useQuery } from "#hooks/use-query"
import { useAuthorize } from "../../providers/AuthorizeProvider"
import {
  ownerService,
  type OwnerRegistrationPayload,
} from "../../services/OwnerService"

type RegistrationErrors = Partial<
  Record<keyof OwnerRegistrationPayload, string>
>

const idCardPattern = /^(?:\d{9}|\d{12})$/

export function RegisterOwnerPage() {
  const { session } = useAuthorize()
  const { execute: submitRegistration, inProcess: isSubmitting } = useQuery()
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [requestError, setRequestError] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError("")
    setIsSubmitted(false)

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const values: OwnerRegistrationPayload = {
      business_name: String(form.get("business_name") || "").trim(),
      business_address: String(form.get("business_address") || "").trim(),
      id_card: String(form.get("id_card") || "").trim().replace(/\s/g, ""),
      note: String(form.get("note") || "").trim(),
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

    await submitRegistration(
      async () => {
        await ownerService.createRegistration(values)
        formElement.reset()
        setIsSubmitted(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
      },
      {
        onError(error) {
          setRequestError(error.message)
        },
      },
    )
  }

  const accountInformation = (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <BriefcaseBusinessIcon className="size-5" aria-hidden="true" />
        <h2 className="font-semibold">Thông tin người đăng ký</h2>
      </div>
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
            <dd className="truncate text-sm font-medium">{session?.fullName}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <MailIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="truncate text-sm font-medium">{session?.email}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <PhoneIcon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Số điện thoại</dt>
            <dd className="truncate text-sm font-medium">{session?.phone}</dd>
          </div>
        </div>
      </dl>
    </section>
  )

  const ownerProfile = session?.poiOwner
  if (
    ownerProfile?.status === "pending" ||
    ownerProfile?.status === "approved"
  ) {
    const isApproved = ownerProfile.status === "approved"
    const StatusIcon = isApproved ? CheckCircle2Icon : Clock3Icon

    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-start gap-3 border-b border-black/5 p-5 dark:border-white/5">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                isApproved
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
              }`}
            >
              <StatusIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-semibold">Hồ sơ chủ quán</h1>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isApproved
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isApproved ? "Đã duyệt" : "Chờ duyệt"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isApproved
                  ? "Hồ sơ đã được phê duyệt. Bạn có thể truy cập Portal quản lý."
                  : "Hồ sơ đang được quản trị viên kiểm tra và phê duyệt."}
              </p>
            </div>
          </div>

          <dl>
            <div className="border-b border-black/5 p-5 dark:border-white/5">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Tên doanh nghiệp
              </dt>
              <dd className="mt-2 text-sm font-medium">
                {ownerProfile.bussiness_name}
              </dd>
            </div>
            <div
              className={
                ownerProfile.admin_note
                  ? "border-b border-black/5 p-5 dark:border-white/5"
                  : "p-5"
              }
            >
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Địa chỉ kinh doanh
              </dt>
              <dd className="mt-2 text-sm">
                {ownerProfile.bussiness_address}
              </dd>
            </div>
            {ownerProfile.admin_note && (
              <div className="p-5">
                <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Phản hồi quản trị viên
                </dt>
                <dd className="mt-2 text-sm">{ownerProfile.admin_note}</dd>
              </div>
            )}
          </dl>
        </section>

        {accountInformation}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {isSubmitted && (
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>Đã gửi hồ sơ đăng ký</AlertTitle>
          <AlertDescription>
            Hồ sơ của bạn đang chờ quản trị viên kiểm tra và phê duyệt.
          </AlertDescription>
        </Alert>
      )}

      {accountInformation}

      <form
        className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <FieldGroup>
          <div>
            <h1 className="text-lg font-semibold">Đăng ký làm chủ quán</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cung cấp thông tin kinh doanh để được xác minh và cấp quyền quản lý.
            </p>
          </div>

          {requestError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể gửi hồ sơ</AlertTitle>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          )}

          <Field data-invalid={Boolean(errors.business_name)}>
            <FieldLabel htmlFor="business_name">Tên doanh nghiệp hoặc hộ kinh doanh</FieldLabel>
            <Input
              id="business_name"
              name="business_name"
              autoComplete="organization"
              placeholder="Tên hiển thị trên hệ thống"
              aria-invalid={Boolean(errors.business_name)}
              disabled={isSubmitting}
            />
            <FieldError>{errors.business_name}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.business_address)}>
            <FieldLabel htmlFor="business_address">Địa chỉ kinh doanh</FieldLabel>
            <Input
              id="business_address"
              name="business_address"
              autoComplete="street-address"
              placeholder="Số nhà, tên đường, phường, quận"
              aria-invalid={Boolean(errors.business_address)}
              disabled={isSubmitting}
            />
            <FieldError>{errors.business_address}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.id_card)}>
            <FieldLabel htmlFor="id_card">Số CCCD/CMND</FieldLabel>
            <Input
              id="id_card"
              name="id_card"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Nhập 9 hoặc 12 chữ số"
              aria-invalid={Boolean(errors.id_card)}
              disabled={isSubmitting}
            />
            <FieldDescription>
              Thông tin được mã hóa và chỉ sử dụng cho mục đích xác minh.
            </FieldDescription>
            <FieldError>{errors.id_card}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="note">Ghi chú</FieldLabel>
            <Textarea
              id="note"
              name="note"
              placeholder="Thông tin bổ sung dành cho quản trị viên (không bắt buộc)"
              rows={4}
              disabled={isSubmitting}
            />
          </Field>

          <Button
            className="h-10 sm:self-end"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <SendIcon aria-hidden="true" />
            )}
            {isSubmitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
