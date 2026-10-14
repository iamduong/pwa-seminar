import { type FormEvent, useState } from "react"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon, Loader2Icon, SendIcon } from "lucide-react"

import { AuthLayout } from "#components/auth/AuthLayout"
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "#components/ui/field"
import { Input } from "#components/ui/input"
import { getApiErrorMessage } from "#lib/api"
import { authService, type RegisterOwnerPayload } from "../../services/AuthService"

type RegistrationField = keyof RegisterOwnerPayload | "confirm_password"
type RegistrationErrors = Partial<Record<RegistrationField, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^(?:\+84|0)\d{9}$/
const idCardPattern = /^(?:\d{9}|\d{12})$/

function validateRegistration(values: RegisterOwnerPayload & { confirm_password: string }) {
  const errors: RegistrationErrors = {}

  if (values.full_name.length < 2) errors.full_name = "Vui lòng nhập họ và tên hợp lệ."
  if (!emailPattern.test(values.email)) errors.email = "Email chưa đúng định dạng."
  if (!phonePattern.test(values.phone)) errors.phone = "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có đủ 10 chữ số."
  if (values.password.length < 8) errors.password = "Mật khẩu phải có ít nhất 8 ký tự."
  if (values.confirm_password !== values.password) errors.confirm_password = "Mật khẩu xác nhận không khớp."
  if (values.business_name.length < 2) errors.business_name = "Vui lòng nhập tên doanh nghiệp hoặc hộ kinh doanh."
  if (values.business_address.length < 5) errors.business_address = "Vui lòng nhập địa chỉ kinh doanh đầy đủ."
  if (!idCardPattern.test(values.id_card)) errors.id_card = "CCCD/CMND phải gồm 9 hoặc 12 chữ số."

  return errors
}

export function RegisterOwnerPage() {
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [requestError, setRequestError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError("")

    const form = new FormData(event.currentTarget)
    const values = {
      full_name: String(form.get("full_name") || "").trim(),
      email: String(form.get("email") || "").trim().toLowerCase(),
      phone: String(form.get("phone") || "").trim().replace(/\s/g, ""),
      password: String(form.get("password") || ""),
      confirm_password: String(form.get("confirm_password") || ""),
      business_name: String(form.get("business_name") || "").trim(),
      business_address: String(form.get("business_address") || "").trim(),
      id_card: String(form.get("id_card") || "").trim().replace(/\s/g, ""),
    }
    const nextErrors = validateRegistration(values)

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const { confirm_password: _confirmPassword, ...payload } = values
    void _confirmPassword

    try {
      setIsSubmitting(true)
      await authService.registerOwner(payload)
      setIsRegistered(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      setRequestError(getApiErrorMessage(error, "Không thể gửi hồ sơ đăng ký. Vui lòng thử lại."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRegistered) {
    return (
      <AuthLayout
        title="Đã tiếp nhận hồ sơ"
        description="Hồ sơ đăng ký đối tác của bạn đã được gửi đến bộ phận quản trị."
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CheckCircle2Icon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-semibold">Đăng ký thành công</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Bạn có thể đăng nhập để theo dõi trạng thái xét duyệt. Quyền quản lý địa điểm sẽ được mở sau khi hồ sơ được chấp thuận.
          </p>
          <a className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80" href="/login">
            Đi đến trang đăng nhập
          </a>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      wide
      title="Đăng ký đối tác"
      description="Cung cấp thông tin chính xác để đăng ký tài khoản chủ doanh nghiệp. Hồ sơ sẽ được quản trị viên xét duyệt trước khi kích hoạt."
    >
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {requestError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể gửi hồ sơ</AlertTitle>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          )}

          <fieldset>
            <legend className="mb-4 text-sm font-semibold">Thông tin người đại diện</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.full_name)}>
                <FieldLabel htmlFor="full_name">Họ và tên</FieldLabel>
                <Input id="full_name" name="full_name" autoComplete="name" placeholder="Nguyễn Văn An" aria-invalid={Boolean(errors.full_name)} disabled={isSubmitting} />
                <FieldError>{errors.full_name}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
                <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0901234567" aria-invalid={Boolean(errors.phone)} disabled={isSubmitting} />
                <FieldError>{errors.phone}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="name@business.vn" aria-invalid={Boolean(errors.email)} disabled={isSubmitting} />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.id_card)}>
                <FieldLabel htmlFor="id_card">Số CCCD/CMND</FieldLabel>
                <Input id="id_card" name="id_card" inputMode="numeric" autoComplete="off" placeholder="Nhập 9 hoặc 12 chữ số" aria-invalid={Boolean(errors.id_card)} disabled={isSubmitting} />
                <FieldError>{errors.id_card}</FieldError>
              </Field>
            </div>
          </fieldset>

          <fieldset className="border-t pt-5">
            <legend className="mb-4 text-sm font-semibold">Thông tin đăng nhập</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <div className="relative">
                  <Input className="pr-10" id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" aria-invalid={Boolean(errors.password)} disabled={isSubmitting} />
                  <button className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  </button>
                </div>
                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.confirm_password)}>
                <FieldLabel htmlFor="confirm_password">Xác nhận mật khẩu</FieldLabel>
                <Input id="confirm_password" name="confirm_password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Nhập lại mật khẩu" aria-invalid={Boolean(errors.confirm_password)} disabled={isSubmitting} />
                <FieldError>{errors.confirm_password}</FieldError>
              </Field>
            </div>
          </fieldset>

          <fieldset className="border-t pt-5">
            <legend className="mb-4 text-sm font-semibold">Thông tin doanh nghiệp</legend>
            <div className="grid gap-5">
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
            </div>
          </fieldset>

          <Button className="h-10 w-full sm:w-auto sm:self-end sm:px-5" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <SendIcon aria-hidden="true" />}
            {isSubmitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ đăng ký"}
          </Button>
        </FieldGroup>
      </form>

      <div className="mt-7 border-t pt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <a className="font-medium text-foreground underline-offset-4 hover:underline" href="/login">
          Đăng nhập
        </a>
      </div>
    </AuthLayout>
  )
}
