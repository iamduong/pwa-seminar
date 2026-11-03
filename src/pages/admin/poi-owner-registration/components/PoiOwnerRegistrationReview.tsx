import { useState } from "react";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";

import { Button } from "#components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "#components/ui/field";
import { Textarea } from "#components/ui/textarea";
import { getApiErrorMessage } from "#lib/api";

export interface PoiOwnerRegistrationReviewDecision {
  status: "approved" | "rejected";
  adminNote: string;
}

interface PoiOwnerRegistrationReviewProps {
  onSubmit?: (decision: PoiOwnerRegistrationReviewDecision) => void | Promise<void>;
}

export function PoiOwnerRegistrationReview({
  onSubmit,
}: PoiOwnerRegistrationReviewProps) {
  const [adminNote, setAdminNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState<"approved" | "rejected" | null>(
    null,
  );

  const disabled = !onSubmit || submitting !== null;

  async function submit(status: PoiOwnerRegistrationReviewDecision["status"]) {
    if (!onSubmit) return;

    const note = adminNote.trim();
    if (status === "rejected" && !note) {
      setErrorMessage("Vui lòng nhập lý do từ chối đơn đăng ký.");
      return;
    }

    setErrorMessage("");
    setSubmitting(status);

    try {
      await onSubmit({ status, adminNote: note });
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xử lý đơn đăng ký. Vui lòng thử lại."),
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="registration-review-title">
      <div>
        <h3 id="registration-review-title" className="font-semibold">
          Xử lý đơn đăng ký
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Duyệt để cấp quyền chủ địa điểm, hoặc từ chối kèm lý do để người đăng
          ký biết.
        </p>
      </div>

      <Field data-invalid={Boolean(errorMessage)}>
        <FieldLabel htmlFor="admin-note">Ghi chú của quản trị viên</FieldLabel>
        <Textarea
          id="admin-note"
          value={adminNote}
          rows={3}
          maxLength={500}
          placeholder="Bắt buộc khi từ chối, không bắt buộc khi duyệt"
          disabled={submitting !== null}
          aria-invalid={Boolean(errorMessage)}
          onChange={(event) => {
            setAdminNote(event.target.value);
            if (errorMessage) setErrorMessage("");
          }}
        />
        <FieldError>{errorMessage}</FieldError>
        {!onSubmit && (
          <FieldDescription>
            Chức năng duyệt và từ chối đang được hoàn thiện.
          </FieldDescription>
        )}
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="destructive"
          disabled={disabled}
          onClick={() => void submit("rejected")}
        >
          {submitting === "rejected" ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <XIcon aria-hidden="true" />
          )}
          Từ chối
        </Button>
        <Button
          type="button"
          disabled={disabled}
          onClick={() => void submit("approved")}
        >
          {submitting === "approved" ? (
            <Loader2Icon className="animate-spin" aria-hidden="true" />
          ) : (
            <CheckIcon aria-hidden="true" />
          )}
          Duyệt đơn
        </Button>
      </div>
    </section>
  );
}
