import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  ImagesIcon,
  MapPinIcon,
  StoreIcon,
  XIcon,
} from "lucide-react";
import { Link, useParams } from "react-router";

import HybridMap from "#components/map/HybridMap";
import type { MapCoordinates } from "../../../components/map/lib/map-type";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import { Label } from "#components/ui/label";
import { Skeleton } from "#components/ui/skeleton";
import { Switch } from "#components/ui/switch";
import { Textarea } from "#components/ui/textarea";
import { getApiErrorMessage } from "#lib/api";
import { poiSubmissionService } from "../../../services/PoiSubmissionService";
import type {
  PoiSubmission,
  PoiSubmissionStatus,
} from "../../../types/PoiSubmission";

const LIST_PATH = "/quan-ly/don-dang-ky-poi/danh-sach-don-poi";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_LABELS: Record<PoiSubmissionStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const STATUS_CLASSES: Record<PoiSubmissionStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-400/10 dark:text-red-300",
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

function getMapCoordinates(submission: PoiSubmission): MapCoordinates | null {
  const coordinates = submission.location.coordinates;
  if (
    coordinates.length !== 2 ||
    !coordinates.every((coordinate) => Number.isFinite(coordinate))
  ) {
    return null;
  }

  return [coordinates[0], coordinates[1]];
}

export default function PoiSubmissionDetailPage() {
  const { id = "" } = useParams();
  const hasValidId = UUID_PATTERN.test(id);
  const [submission, setSubmission] = useState<PoiSubmission | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [activationRequested, setActivationRequested] = useState(false);
  const [adminNoteError, setAdminNoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(hasValidId);
  const [reviewing, setReviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<
    "approved" | "rejected" | null
  >(null);

  useEffect(() => {
    if (!hasValidId) return;

    const controller = new AbortController();

    async function loadSubmission() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await poiSubmissionService.GetPoiSubmissionById(
          id,
          controller.signal,
        );
        if (!response.success || !response.data) {
          throw new Error("Không tìm thấy dữ liệu đơn đăng ký.");
        }

        setSubmission(response.data);
        setAdminNote(response.data.admin_note ?? "");
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setSubmission(null);
          setErrorMessage(
            getApiErrorMessage(
              error,
              error instanceof Error
                ? error.message
                : "Không thể tải chi tiết đơn đăng ký.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSubmission();
    return () => controller.abort();
  }, [hasValidId, id]);

  async function review(status: "approved" | "rejected") {
    if (!submission || reviewing) return;

    if (status === "rejected" && !adminNote.trim()) {
      setAdminNoteError("Vui lòng nhập lý do từ chối đơn đăng ký.");
      return;
    }

    setReviewing(true);
    setAdminNoteError(null);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await poiSubmissionService.ReviewPoiSubmission(
        submission.id,
        {
          status,
          admin_note: adminNote.trim(),
          activation_requested: activationRequested,
          audio_priority: 100,
        },
      );

      if (!response.success || !response.data) {
        throw new Error("Dữ liệu trả về không hợp lệ.");
      }

      setSubmission(response.data);
      setAdminNote(response.data.admin_note ?? "");
      setReviewDecision(null);
      setSuccessMessage(
        status === "approved"
          ? "Đã duyệt đơn đăng ký POI."
          : "Đã từ chối đơn đăng ký POI.",
      );
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xử lý đơn đăng ký. Vui lòng thử lại."),
      );
    } finally {
      setReviewing(false);
    }
  }

  if (hasValidId && loading) return <DetailLoading />;

  if (!hasValidId || !submission) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" render={<Link to={LIST_PATH} />}>
          <ArrowLeftIcon aria-hidden="true" />
          Quay lại danh sách
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể hiển thị đơn đăng ký</AlertTitle>
          <AlertDescription>
            {!hasValidId
              ? "Mã đơn đăng ký không hợp lệ."
              : (errorMessage ?? "Không tìm thấy đơn đăng ký POI.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const coordinates = getMapCoordinates(submission);

  return (
    <div className="space-y-6">
      <header>
        <Button
          variant="ghost"
          render={<Link to={LIST_PATH} />}
          className="mb-3"
        >
          <ArrowLeftIcon aria-hidden="true" />
          Quay lại danh sách
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Chi tiết đơn đăng ký POI</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {submission.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Mã đơn: {submission.id}
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${STATUS_CLASSES[submission.status]}`}
          >
            {STATUS_LABELS[submission.status]}
          </span>
        </div>
      </header>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể hoàn tất thao tác</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <CheckIcon aria-hidden="true" />
          <AlertTitle>Xử lý thành công</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.85fr)_minmax(30rem,1.15fr)]">
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <StoreIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Thông tin địa điểm</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Detail label="Tên địa điểm" value={submission.name} />
            <Detail label="Danh mục" value={submission.category_name} />
            <Detail
              label="Loại yêu cầu"
              value={submission.submission_type === "create" ? "Tạo mới" : "Cập nhật"}
            />
            <Detail label="Bán kính kích hoạt" value={`${submission.trigger_radius} m`} />
          </div>
          <Detail label="Địa chỉ" value={submission.address} />
          <Detail label="Mô tả" value={submission.description} />
          <Detail
            label="Tọa độ"
            value={coordinates ? `${coordinates[1]}, ${coordinates[0]}` : "Không hợp lệ"}
          />
          <Detail
            label="Ghi chú của người đăng ký"
            value={submission.owner_note || "Không có ghi chú"}
          />

          <div className="grid gap-3 border-t pt-5 sm:grid-cols-2">
            <Detail label="Ngày gửi" value={formatDateTime(submission.created_at)} />
            <Detail label="Cập nhật lần cuối" value={formatDateTime(submission.updated_at)} />
          </div>

          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center gap-2">
              <ImagesIcon className="size-4" aria-hidden="true" />
              <h3 className="text-sm font-medium">Hình ảnh địa điểm</h3>
            </div>
            {submission.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {submission.images.map((image, index) => (
                  <img
                    key={`${image}:${index}`}
                    src={image}
                    alt={`${submission.name} - ảnh ${index + 1}`}
                    className="h-28 w-full rounded-lg border bg-muted object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Không có hình ảnh.</p>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-4" aria-hidden="true" />
              <h2 className="font-semibold">Vị trí trên bản đồ</h2>
            </div>
            {coordinates ? (
              <HybridMap
                className="h-112"
                initialCenter={coordinates}
                initialZoom={16}
                selectedLocation={{
                  location: coordinates,
                  radius: submission.trigger_radius,
                }}
              />
            ) : (
              <Alert variant="destructive">
                <AlertCircleIcon aria-hidden="true" />
                <AlertTitle>Không thể hiển thị bản đồ</AlertTitle>
                <AlertDescription>Dữ liệu tọa độ không hợp lệ.</AlertDescription>
              </Alert>
            )}
          </section>

          <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
            <div>
              <h2 className="font-semibold">Kiểm duyệt đơn đăng ký</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kiểm tra thông tin và vị trí trước khi đưa ra quyết định.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="admin-note">
                Ghi chú quản trị {submission.status === "pending" && "(bắt buộc khi từ chối)"}
              </Label>
              <Textarea
                id="admin-note"
                rows={4}
                maxLength={1000}
                value={adminNote}
                aria-invalid={adminNoteError ? true : undefined}
                aria-describedby={adminNoteError ? "admin-note-error" : undefined}
                disabled={submission.status !== "pending" || reviewing}
                onChange={(event) => {
                  setAdminNote(event.target.value);
                  if (adminNoteError && event.target.value.trim()) {
                    setAdminNoteError(null);
                  }
                }}
                placeholder="Nhập ghi chú hoặc lý do từ chối"
              />
              {adminNoteError && (
                <p id="admin-note-error" className="text-sm text-destructive">
                  {adminNoteError}
                </p>
              )}
            </div>

            {submission.status === "pending" ? (
              <>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <Label htmlFor="activation-requested">Yêu cầu kích hoạt POI</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Giá trị này sẽ được gửi cùng kết quả kiểm duyệt.
                    </p>
                  </div>
                  <Switch
                    id="activation-requested"
                    checked={activationRequested}
                    disabled={reviewing}
                    onCheckedChange={setActivationRequested}
                    aria-label="Yêu cầu kích hoạt POI"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={reviewing}
                    onClick={() => {
                      if (!adminNote.trim()) {
                        setAdminNoteError("Vui lòng nhập lý do từ chối đơn đăng ký.");
                        return;
                      }
                      setAdminNoteError(null);
                      setReviewDecision("rejected");
                    }}
                  >
                    <XIcon aria-hidden="true" />
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    disabled={reviewing}
                    onClick={() => {
                      setAdminNoteError(null);
                      setReviewDecision("approved");
                    }}
                  >
                    <CheckIcon aria-hidden="true" />
                    {reviewing ? "Đang xử lý…" : "Duyệt đơn"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm">
                <ClockIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">{STATUS_LABELS[submission.status]}</p>
                  <p className="mt-1 text-muted-foreground">
                    Đơn đã được xử lý và không thể kiểm duyệt lại.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog
        open={reviewDecision !== null}
        onOpenChange={(open) => {
          if (!open && !reviewing) setReviewDecision(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDecision === "approved"
                ? "Xác nhận duyệt đơn"
                : "Xác nhận từ chối đơn"}
            </DialogTitle>
            <DialogDescription>
              {reviewDecision === "approved"
                ? "POI sẽ được tạo theo thông tin trong đơn và không thể kiểm duyệt lại."
                : "Đơn đăng ký sẽ được đánh dấu là đã từ chối và không thể xử lý lại."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={reviewing}
              onClick={() => setReviewDecision(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant={reviewDecision === "approved" ? "default" : "destructive"}
              disabled={reviewing}
              onClick={() => {
                if (reviewDecision) void review(reviewDecision);
              }}
            >
              {reviewDecision === "approved" ? (
                <CheckIcon aria-hidden="true" />
              ) : (
                <XIcon aria-hidden="true" />
              )}
              {reviewing
                ? "Đang xử lý…"
                : reviewDecision === "approved"
                  ? "Xác nhận duyệt"
                  : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line wrap-break-word text-sm leading-6">
        {value}
      </p>
    </div>
  );
}

function DetailLoading() {
  return (
    <div className="space-y-6" aria-label="Đang tải chi tiết đơn đăng ký">
      <Skeleton className="h-8 w-44" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-52 max-w-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-120 w-full rounded-xl" />
        <Skeleton className="h-120 w-full rounded-xl" />
      </div>
    </div>
  );
}
