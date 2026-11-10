import { type FormEvent, useEffect, useState } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  Loader2Icon,
  RefreshCwIcon,
  SendIcon,
  StoreIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import { Skeleton } from "#components/ui/skeleton";
import { Textarea } from "#components/ui/textarea";
import { getApiErrorMessage } from "#lib/api";
import { poiOwnerRegistrationService } from "../../../services/PoiOwnerRegistrationService";
import type {
  PoiOwnerRegistration,
  RegisterPoiOwnerRegistration,
} from "../../../types/PoiOwnerRegistration";
import { PoiOwnerRegistrationStatusBadge } from "./components/PoiOwnerRegistrationStatusBadge";

type FormField = keyof RegisterPoiOwnerRegistration;
type FormErrors = Partial<Record<FormField, string>>;

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function validateForm(values: RegisterPoiOwnerRegistration): FormErrors {
  const errors: FormErrors = {};
  const identityNumber = values.id_card.replace(/\s/g, "");

  if (values.business_name.length < 2) {
    errors.business_name = "Vui lòng nhập tên cơ sở kinh doanh hợp lệ.";
  }
  if (values.business_address.length < 5) {
    errors.business_address = "Địa chỉ kinh doanh phải có ít nhất 5 ký tự.";
  }
  if (!/^(?:\d{9}|\d{12})$/.test(identityNumber)) {
    errors.id_card = "Số CMND/CCCD phải gồm 9 hoặc 12 chữ số.";
  }
  if (values.note.length < 10) {
    errors.note = "Vui lòng giới thiệu hoạt động kinh doanh bằng ít nhất 10 ký tự.";
  }

  return errors;
}

interface RegistrationFormProps {
  previousRegistration?: PoiOwnerRegistration;
  submitting: boolean;
  requestError: string | null;
  onSubmit: (payload: RegisterPoiOwnerRegistration) => Promise<void>;
}

function RegistrationForm({
  previousRegistration,
  submitting,
  requestError,
  onSubmit,
}: RegistrationFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: RegisterPoiOwnerRegistration = {
      business_name: String(form.get("business_name") ?? "").trim(),
      business_address: String(form.get("business_address") ?? "").trim(),
      id_card: String(form.get("id_card") ?? "").replace(/\s/g, ""),
      note: String(form.get("note") ?? "").trim(),
    };
    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit(values);
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="owner-registration-form-title">
      <div className="mb-6">
        <h2 id="owner-registration-form-title" className="text-lg font-semibold">
          {previousRegistration ? "Gửi lại hồ sơ" : "Thông tin đăng ký"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản trị viên sẽ kiểm tra thông tin trước khi cấp quyền quản lý địa điểm.
        </p>
      </div>

      {requestError && (
        <Alert className="mb-5" variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể gửi hồ sơ</AlertTitle>
          <AlertDescription>{requestError}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Field data-invalid={Boolean(errors.business_name)}>
          <FieldLabel htmlFor="business_name">Tên cơ sở kinh doanh</FieldLabel>
          <Input
            id="business_name"
            name="business_name"
            defaultValue={previousRegistration?.business_name}
            placeholder="Ví dụ: Quán ăn Bến Nhà Rồng"
            maxLength={200}
            disabled={submitting}
            aria-invalid={Boolean(errors.business_name)}
          />
          <FieldError>{errors.business_name}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.business_address)}>
          <FieldLabel htmlFor="business_address">Địa chỉ kinh doanh</FieldLabel>
          <Textarea
            id="business_address"
            name="business_address"
            defaultValue={previousRegistration?.business_address}
            placeholder="Nhập địa chỉ đầy đủ của cơ sở"
            maxLength={500}
            rows={3}
            disabled={submitting}
            aria-invalid={Boolean(errors.business_address)}
          />
          <FieldError>{errors.business_address}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.id_card)}>
          <FieldLabel htmlFor="id_card">Số CMND/CCCD của người đại diện</FieldLabel>
          <Input
            id="id_card"
            name="id_card"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Nhập 9 hoặc 12 chữ số"
            maxLength={12}
            disabled={submitting}
            aria-invalid={Boolean(errors.id_card)}
          />
          <FieldDescription>
            Thông tin này được mã hóa và không hiển thị lại sau khi gửi.
          </FieldDescription>
          <FieldError>{errors.id_card}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.note)}>
          <FieldLabel htmlFor="note">Giới thiệu hoạt động kinh doanh</FieldLabel>
          <Textarea
            id="note"
            name="note"
            defaultValue={previousRegistration?.note}
            placeholder="Mô tả ngắn về cơ sở, loại hình kinh doanh và nhu cầu quản lý địa điểm..."
            maxLength={2000}
            rows={5}
            disabled={submitting}
            aria-invalid={Boolean(errors.note)}
          />
          <FieldError>{errors.note}</FieldError>
        </Field>

        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <SendIcon aria-hidden="true" />
          )}
          {submitting ? "Đang gửi hồ sơ…" : previousRegistration ? "Gửi lại hồ sơ" : "Gửi hồ sơ đăng ký"}
        </Button>
      </form>
    </section>
  );
}

function CurrentRegistration({ registration }: { registration: PoiOwnerRegistration }) {
  const statusContent = {
    pending: {
      icon: Clock3Icon,
      title: "Hồ sơ đang chờ xét duyệt",
      description: "Bạn vẫn có thể đăng nhập và theo dõi hồ sơ tại trang này. Các chức năng chủ quán sẽ được mở sau khi hồ sơ được duyệt.",
    },
    approved: {
      icon: CheckCircle2Icon,
      title: "Hồ sơ đã được duyệt",
      description: "Tài khoản của bạn đã được xác nhận là chủ quán. Hãy đăng nhập lại nếu sidebar chưa cập nhật các chức năng quản lý.",
    },
    rejected: {
      icon: AlertCircleIcon,
      title: "Hồ sơ cần được bổ sung",
      description: "Vui lòng xem phản hồi của quản trị viên và gửi lại hồ sơ ở biểu mẫu bên dưới.",
    },
  }[registration.status];
  const StatusIcon = statusContent.icon;

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="current-registration-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <StatusIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="current-registration-title" className="font-semibold">{statusContent.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {statusContent.description}
            </p>
          </div>
        </div>
        <PoiOwnerRegistrationStatusBadge status={registration.status} />
      </div>

      <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-muted-foreground">Tên cơ sở</dt>
          <dd className="mt-1 text-sm font-medium">{registration.business_name}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-muted-foreground">Địa chỉ kinh doanh</dt>
          <dd className="mt-1 text-sm">{registration.business_address}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Ngày gửi</dt>
          <dd className="mt-1 text-sm">{formatDateTime(registration.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-muted-foreground">Mã hồ sơ</dt>
          <dd className="mt-1 break-all font-mono text-xs">{registration.id}</dd>
        </div>
        {registration.admin_note && (
          <div className="rounded-lg border bg-muted/30 p-4 sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-muted-foreground">Phản hồi của quản trị viên</dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm">{registration.admin_note}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

export default function SelfPoiOwnerRegistrationPage() {
  const [registrations, setRegistrations] = useState<PoiOwnerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRegistrations() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await poiOwnerRegistrationService.GetSelfRegistrations(controller.signal);
        if (!response.success || !response.data) throw new Error(response.message);
        if (!controller.signal.aborted) setRegistrations(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setLoadError(getApiErrorMessage(error, "Không thể tải hồ sơ đăng ký của bạn."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadRegistrations();
    return () => controller.abort();
  }, [requestVersion]);

  const currentRegistration = registrations[0];
  const canSubmit = !currentRegistration || currentRegistration.status === "rejected";

  async function submitRegistration(payload: RegisterPoiOwnerRegistration) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = currentRegistration
        ? await poiOwnerRegistrationService.ReRegisterPoiOwner(payload)
        : await poiOwnerRegistrationService.RegisterPoiOwner(payload);
      if (!response.success || !response.data) throw new Error(response.message);
      setRequestVersion((version) => version + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error, "Không thể gửi hồ sơ đăng ký."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Cổng đối tác</p>
        <div className="mt-1 flex items-center gap-3">
          <StoreIcon className="size-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Đăng ký làm chủ quán</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Gửi hồ sơ xác minh để quản lý địa điểm, nội dung thuyết minh và thực đơn của cơ sở trên Quan4 Tourism.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : loadError ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tải hồ sơ</AlertTitle>
          <AlertDescription>
            <p>{loadError}</p>
            <Button className="mt-3" type="button" size="sm" variant="outline" onClick={() => setRequestVersion((version) => version + 1)}>
              <RefreshCwIcon aria-hidden="true" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {currentRegistration && <CurrentRegistration registration={currentRegistration} />}

          {canSubmit && (
            <RegistrationForm
              key={currentRegistration?.id ?? "new"}
              previousRegistration={currentRegistration}
              submitting={submitting}
              requestError={submitError}
              onSubmit={submitRegistration}
            />
          )}

          {registrations.length > 1 && (
            <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="registration-history-title">
              <h2 id="registration-history-title" className="font-semibold">Lịch sử hồ sơ</h2>
              <div className="mt-4 divide-y">
                {registrations.slice(1).map((registration) => (
                  <article key={registration.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{registration.business_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Gửi lúc {formatDateTime(registration.created_at)}
                        {registration.admin_note ? ` · ${registration.admin_note}` : ""}
                      </p>
                    </div>
                    <PoiOwnerRegistrationStatusBadge status={registration.status} />
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
