import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#components/ui/dialog";
import type { PoiOwnerRegistration } from "../../../types/PoiOwnerRegistration";
import { PoiOwnerRegistrationDetail } from "./components/PoiOwnerRegistrationDetail";
import {
  PoiOwnerRegistrationReview,
  type PoiOwnerRegistrationReviewDecision,
} from "./components/PoiOwnerRegistrationReview";

interface PoiOwnerRegistrationDetailPageProps {
  registration: PoiOwnerRegistration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview?: (
    decision: PoiOwnerRegistrationReviewDecision,
  ) => void | Promise<void>;
}

export default function PoiOwnerRegistrationDetailPage({
  registration,
  open,
  onOpenChange,
  onReview,
}: PoiOwnerRegistrationDetailPageProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết đơn đăng ký</DialogTitle>
          <DialogDescription>
            {registration
              ? registration.business_name
              : "Thông tin hồ sơ đăng ký chủ địa điểm."}
          </DialogDescription>
        </DialogHeader>

        {registration && (
          <div className="-mx-1 max-h-[70vh] space-y-6 overflow-y-auto px-1">
            <PoiOwnerRegistrationDetail registration={registration} />

            {registration.status === "pending" ? (
              <PoiOwnerRegistrationReview
                key={`${registration.id}:${open}`}
                onSubmit={onReview}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Đơn đăng ký đã được xử lý nên không thể duyệt lại.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
