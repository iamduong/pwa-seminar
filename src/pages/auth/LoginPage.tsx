import { type FormEvent, useState } from "react"
import { EyeIcon, EyeOffIcon, Loader2Icon, LogInIcon } from "lucide-react"
import { useNavigate } from "react-router"

import { AuthLayout } from "#components/auth/AuthLayout"
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "#components/ui/field"
import { Input } from "#components/ui/input"
import { useAuth } from "#hooks/use-auth"
import { getApiErrorMessage } from "#lib/api"

interface LoginErrors {
  identifier?: string
  password?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<LoginErrors>({})
  const [requestError, setRequestError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError("")
    setIsSuccess(false)

    const form = new FormData(event.currentTarget)
    const identifier = String(form.get("identifier") || "").trim()
    const password = String(form.get("password") || "")
    const nextErrors: LoginErrors = {}

    if (!identifier) nextErrors.identifier = "Vui lòng nhập email hoặc số điện thoại."
    if (!password) nextErrors.password = "Vui lòng nhập mật khẩu."

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      setIsSubmitting(true)
      const user = await login({ identifier, password })
      setIsSuccess(true)
      navigate(
        user.ownerSummary && !user.isPoiOwnerVerified
          ? "/owner/registration-status"
          : "/dashboard",
        { replace: true },
      )
    } catch (error) {
      setRequestError(getApiErrorMessage(error, "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Đăng nhập"
      description="Truy cập trang quản lý dành cho quản trị viên và đối tác doanh nghiệp."
    >
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {requestError && (
            <Alert variant="destructive">
              <AlertTitle>Không thể đăng nhập</AlertTitle>
              <AlertDescription>{requestError}</AlertDescription>
            </Alert>
          )}

          {isSuccess && (
            <Alert>
              <AlertTitle>Đăng nhập thành công</AlertTitle>
              <AlertDescription>
                Phiên đăng nhập đã được thiết lập. Trang quản lý sẽ được kết nối ở bước tiếp theo.
              </AlertDescription>
            </Alert>
          )}

          <Field data-invalid={Boolean(errors.identifier)}>
            <FieldLabel htmlFor="identifier">Email hoặc số điện thoại</FieldLabel>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="name@business.vn"
              aria-invalid={Boolean(errors.identifier)}
              disabled={isSubmitting}
            />
            <FieldError>{errors.identifier}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.password)}>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
              <a className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="mailto:support@quan4tourism.vn">
                Cần hỗ trợ?
              </a>
            </div>
            <div className="relative">
              <Input
                className="pr-10"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                aria-invalid={Boolean(errors.password)}
                disabled={isSubmitting}
              />
              <button
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
            <FieldError>{errors.password}</FieldError>
          </Field>

          <Button className="h-10 w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <LogInIcon aria-hidden="true" />
            )}
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </FieldGroup>
      </form>

      <div className="mt-7 border-t pt-6 text-center text-sm text-muted-foreground">
        Bạn muốn đưa doanh nghiệp lên hệ thống?{" "}
        <a className="font-medium text-foreground underline-offset-4 hover:underline" href="/register-owner">
          Đăng ký đối tác
        </a>
      </div>
    </AuthLayout>
  )
}
