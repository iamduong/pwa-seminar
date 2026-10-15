import { type FormEvent, useState } from "react"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon, Loader2Icon, UserPlusIcon } from "lucide-react"
import { Link } from "react-router"

import { AuthLayout } from "#components/auth/AuthLayout"
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "#components/ui/field"
import { Input } from "#components/ui/input"
import { getApiErrorMessage } from "#lib/api"
import { authService, type RegisterPayload } from "../../services/AuthService"

type RegistrationField = keyof RegisterPayload | "confirm_password"
type RegistrationErrors = Partial<Record<RegistrationField, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^(?:\+84|0)\d{9}$/

function validateRegistration(values: RegisterPayload & { confirm_password: string }) {
  const errors: RegistrationErrors = {}

  if (values.full_name.length < 2) errors.full_name = "Vui lòng nhập họ và tên hợp lệ."
  if (!emailPattern.test(values.email)) errors.email = "Email chưa đúng định dạng."
  if (!phonePattern.test(values.phone)) {
    errors.phone = "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có đủ 10 chữ số."
  }
  if (values.password.length < 8) errors.password = "Mật khẩu phải có ít nhất 8 ký tự."
  if (values.confirm_password !== values.password) {
    errors.confirm_password = "Mật khẩu xác nhận không khớp."
  }

  return errors
}

export function RegisterPage() {
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
    }
    const nextErrors = validateRegistration(values)

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const { confirm_password: _confirmPassword, ...payload } = values
    void _confirmPassword

    try {
      setIsSubmitting(true)
      await authService.register(payload)
      setIsRegistered(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      setRequestError(
        getApiErrorMessage(error, "Không thể đăng ký tài khoản. Vui lòng thử lại."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRegistered) {
    return (
      <AuthLayout
        title="Đăng ký thành công"
        description="Tài khoản của bạn đã sẵn sàng để đăng nhập."
      >
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CheckCircle2Icon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-semibold">Chào mừng bạn đến với Quan4 Tourism</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Đăng nhập để khám phá địa điểm hoặc đăng ký trở thành chủ địa điểm.
          </p>
          <Button className="mt-6" render={<Link to="/login" />}>
            Đi đến trang đăng nhập
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      wide
      title="Tạo tài khoản"
      description="Đăng ký tài khoản để sử dụng các tiện ích của Quan4 Tourism."
    >
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {requestError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể đăng ký</AlertTitle>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          )}

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
            <Field data-invalid={Boolean(errors.email)} className="sm:col-span-2">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com" aria-invalid={Boolean(errors.email)} disabled={isSubmitting} />
              <FieldError>{errors.email}</FieldError>
            </Field>
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

          <Button className="h-10 w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <UserPlusIcon aria-hidden="true" />}
            {isSubmitting ? "Đang đăng ký..." : "Tạo tài khoản"}
          </Button>
        </FieldGroup>
      </form>

      <div className="mt-7 border-t pt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link className="font-medium text-foreground underline-offset-4 hover:underline" to="/login">
          Đăng nhập
        </Link>
      </div>
    </AuthLayout>
  )
}
