import { type FormEvent, useState } from "react";
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Field, FieldError, FieldLabel } from "#components/ui/field";
import { Input } from "#components/ui/input";
import { getApiErrorMessage } from "#lib/api";
import { authorizeService } from "../../../services/AuthorizeService";

type PasswordField = "current_password" | "new_password" | "confirm_password";
type PasswordErrors = Partial<Record<PasswordField, string>>;

function PasswordInput({
  id,
  name,
  autoComplete,
  invalid,
  disabled,
}: {
  id: PasswordField;
  name: PasswordField;
  autoComplete: "current-password" | "new-password";
  invalid: boolean;
  disabled: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        className="pr-10"
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        disabled={disabled}
      />
      <button
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        disabled={disabled}
      >
        {visible ? (
          <EyeOffIcon className="size-4" aria-hidden="true" />
        ) : (
          <EyeIcon className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setSuccessMessage(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("current_password") ?? "");
    const newPassword = String(form.get("new_password") ?? "");
    const confirmPassword = String(form.get("confirm_password") ?? "");
    const nextErrors: PasswordErrors = {};

    if (!currentPassword) {
      nextErrors.current_password = "Vui lòng nhập mật khẩu hiện tại.";
    }
    if (newPassword.length < 8) {
      nextErrors.new_password = "Mật khẩu mới phải có ít nhất 8 ký tự.";
    } else if (newPassword.length > 128) {
      nextErrors.new_password = "Mật khẩu mới không được vượt quá 128 ký tự.";
    } else if (newPassword === currentPassword) {
      nextErrors.new_password = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirm_password = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await authorizeService.ChangePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      if (!response.success) throw new Error(response.message);

      formElement.reset();
      setErrors({});
      setSuccessMessage("Mật khẩu của bạn đã được thay đổi thành công.");
    } catch (error: unknown) {
      setRequestError(
        error instanceof Error && !("response" in error)
          ? error.message
          : getApiErrorMessage(error, "Không thể đổi mật khẩu. Vui lòng thử lại."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Tài khoản</p>
        <div className="mt-1 flex items-center gap-3">
          <KeyRoundIcon className="size-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Đổi mật khẩu</h1>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sử dụng mật khẩu riêng, khó đoán và không chia sẻ mật khẩu với người khác.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
        {requestError && (
          <Alert className="mb-5" variant="destructive">
            <AlertTitle>Không thể đổi mật khẩu</AlertTitle>
            <AlertDescription>{requestError}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-5">
            <CheckCircle2Icon aria-hidden="true" />
            <AlertTitle>Đổi mật khẩu thành công</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <Field data-invalid={Boolean(errors.current_password)}>
            <FieldLabel htmlFor="current_password">Mật khẩu hiện tại</FieldLabel>
            <PasswordInput
              id="current_password"
              name="current_password"
              autoComplete="current-password"
              invalid={Boolean(errors.current_password)}
              disabled={submitting}
            />
            <FieldError>{errors.current_password}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.new_password)}>
            <FieldLabel htmlFor="new_password">Mật khẩu mới</FieldLabel>
            <PasswordInput
              id="new_password"
              name="new_password"
              autoComplete="new-password"
              invalid={Boolean(errors.new_password)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự.</p>
            <FieldError>{errors.new_password}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.confirm_password)}>
            <FieldLabel htmlFor="confirm_password">Xác nhận mật khẩu mới</FieldLabel>
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              autoComplete="new-password"
              invalid={Boolean(errors.confirm_password)}
              disabled={submitting}
            />
            <FieldError>{errors.confirm_password}</FieldError>
          </Field>

          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <KeyRoundIcon aria-hidden="true" />
            )}
            {submitting ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
          </Button>
        </form>
      </section>
    </div>
  );
}
