import { type FormEvent, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  UserPlusIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import useQuery from "#hooks/use-query";
import { adminUserService } from "../../../services/AdminUserService";

interface CreateUserErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm_password?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+84|0)\d{9}$/;

function validateForm(values: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}) {
  const errors: CreateUserErrors = {};

  if (values.full_name.length < 2 || values.full_name.length > 100) {
    errors.full_name = "Họ và tên phải có từ 2 đến 100 ký tự.";
  }

  if (!emailPattern.test(values.email)) {
    errors.email = "Email chưa đúng định dạng.";
  }

  if (!phonePattern.test(values.phone)) {
    errors.phone =
      "Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có đủ 10 chữ số.";
  }

  if (values.password.length < 8) {
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  if (values.confirm_password !== values.password) {
    errors.confirm_password = "Mật khẩu xác nhận không khớp.";
  }

  return errors;
}

export default function AdminUserCreatePage() {
  const navigate = useNavigate();
  const { execute, inProcess: isSubmitting } = useQuery();

  const [errors, setErrors] = useState<CreateUserErrors>({});
  const [requestError, setRequestError] = useState("");
  const [isCreated, setIsCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");

    const form = new FormData(event.currentTarget);

    const values = {
      full_name: String(form.get("full_name") || "").trim(),
      email: String(form.get("email") || "").trim().toLowerCase(),
      phone: String(form.get("phone") || "")
        .trim()
        .replace(/\s/g, ""),
      password: String(form.get("password") || ""),
      confirm_password: String(form.get("confirm_password") || ""),
    };

    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const { confirm_password: _confirmPassword, ...payload } = values;
    void _confirmPassword;

    await execute(
      async () => {
        await adminUserService.CreateAdminUser(payload);
        setIsCreated(true);
      },
      {
        onError(error) {
          setRequestError(error.message);
        },
      },
    );
  }

  if (isCreated) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Alert>
          <CheckCircle2Icon aria-hidden="true" />
          <AlertTitle>Tạo người dùng thành công</AlertTitle>
          <AlertDescription>
            Tài khoản mới đã được lưu vào hệ thống.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col items-center py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <CheckCircle2Icon className="size-7" aria-hidden="true" />
          </span>

          <h2 className="mt-5 text-xl font-semibold">
            Đã tạo tài khoản mới
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Bạn có thể tiếp tục tạo tài khoản khác hoặc quay lại danh sách.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/quan-ly/danh-sach-nguoi-dung")}>
              Xem danh sách người dùng
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Thêm người dùng khác
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit"
          render={<Link to="/quan-ly/danh-sach-nguoi-dung" />}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Quay lại danh sách
        </Button>

        <div>
          <p className="text-sm text-muted-foreground">
            Quản trị hệ thống
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Thêm người dùng
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Nhập thông tin để tạo tài khoản mới trong hệ thống.
          </p>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <UserPlusIcon className="size-5" aria-hidden="true" />
          <h2 className="font-semibold">Thông tin tài khoản</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 p-5"
        >
          <FieldGroup>
            {requestError && (
              <Alert variant="destructive">
                <AlertTitle>Không thể tạo người dùng</AlertTitle>
                <AlertDescription>{requestError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.full_name)}>
                <FieldLabel htmlFor="full_name">Họ và tên</FieldLabel>
                <Input
                  id="full_name"
                  name="full_name"
                  autoComplete="name"
                  placeholder="Nguyễn Văn An"
                  aria-invalid={Boolean(errors.full_name)}
                  disabled={isSubmitting}
                />
                <FieldError>{errors.full_name}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0901234567"
                  aria-invalid={Boolean(errors.phone)}
                  disabled={isSubmitting}
                />
                <FieldError>{errors.phone}</FieldError>
              </Field>

              <Field
                data-invalid={Boolean(errors.email)}
                className="sm:col-span-2"
              >
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  aria-invalid={Boolean(errors.email)}
                  disabled={isSubmitting}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>

                <div className="relative">
                  <Input
                    className="pr-10"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tối thiểu 8 ký tự"
                    aria-invalid={Boolean(errors.password)}
                    disabled={isSubmitting}
                  />

                  <button
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>

                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.confirm_password)}>
                <FieldLabel htmlFor="confirm_password">
                  Xác nhận mật khẩu
                </FieldLabel>

                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                  aria-invalid={Boolean(errors.confirm_password)}
                  disabled={isSubmitting}
                />

                <FieldError>{errors.confirm_password}</FieldError>
              </Field>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">Vai trò mặc định</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Người dùng (User). Hệ thống sẽ tự động gán vai trò này
                sau khi tạo tài khoản.
              </p>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                render={<Link to="/quan-ly/danh-sach-nguoi-dung" />}
              >
                Hủy
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2Icon className="animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlusIcon aria-hidden="true" />
                )}
                {isSubmitting ? "Đang tạo..." : "Tạo người dùng"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}
