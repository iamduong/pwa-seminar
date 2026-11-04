import { type FormEvent, useEffect, useState } from "react";
import { Loader2Icon, SendIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import { Textarea } from "#components/ui/textarea";
import { getApiErrorMessage } from "#lib/api";
import { menuItemService } from "../../../services/MenuItemService";
import type { OwnerPoiOption } from "../../../types/MenuItem";

export default function MenuItemRequestPage() {
  const [pois, setPois] = useState<OwnerPoiOption[]>([]);
  const [loadingPois, setLoadingPois] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    async function loadPois() {
      try {
        const response = await menuItemService.listMyPois();
        if (!response.success || !response.data) throw new Error("Không thể tải POI.");
        setPois(response.data);
      } catch (requestError: unknown) {
        setError(getApiErrorMessage(requestError, "Không thể tải danh sách POI."));
      } finally {
        setLoadingPois(false);
      }
    }
    void loadPois();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setNameError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const poiId = String(form.get("poi_id") || "");
    if (name.length < 2) {
      setNameError("Vui lòng nhập tên món ăn.");
      return;
    }
    setSubmitting(true);
    try {
      await menuItemService.submit({
        poi_id: poiId,
        name,
        description: String(form.get("description") || "").trim() || undefined,
        price: Number(form.get("price")) || undefined,
        image_url: String(form.get("image_url") || "").trim() || undefined,
      });
      event.currentTarget.reset();
      setSuccess("Đã gửi yêu cầu thêm món ăn, vui lòng chờ admin duyệt.");
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Không thể gửi yêu cầu."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Chức năng chủ quán</p>
        <h1 className="mt-1 text-2xl font-semibold">Gửi yêu cầu thực đơn</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Món ăn sẽ ở trạng thái chờ duyệt trước khi được hiển thị.
        </p>
      </header>
      {success && <Alert><AlertTitle>Gửi thành công</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertTitle>Không thể gửi yêu cầu</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {!loadingPois && pois.length === 0 && !error && (
        <Alert>
          <AlertTitle>Chưa có địa điểm để thêm thực đơn</AlertTitle>
          <AlertDescription>
            Bạn cần có ít nhất một POI đã được duyệt và thuộc tài khoản trước khi
            gửi món ăn.
          </AlertDescription>
        </Alert>
      )}
      <form className="rounded-xl border bg-card p-5 shadow-sm" onSubmit={submit} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="poi_id">Địa điểm</FieldLabel>
            <select id="poi_id" name="poi_id" className="h-10 rounded-md border bg-background px-3 text-sm" required disabled={loadingPois || submitting}>
              <option value="">{loadingPois ? "Đang tải..." : "Chọn địa điểm"}</option>
              {pois.map((poi) => <option key={poi.id} value={poi.id}>{poi.name}</option>)}
            </select>
          </Field>
          <Field data-invalid={Boolean(nameError)}>
            <FieldLabel htmlFor="name">Tên món ăn</FieldLabel>
            <Input id="name" name="name" placeholder="Ví dụ: Cơm tấm sườn" disabled={submitting} />
            <FieldError>{nameError}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="price">Giá bán (VNĐ)</FieldLabel>
            <Input id="price" name="price" type="number" min="0" step="1000" disabled={submitting} />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Mô tả</FieldLabel>
            <Textarea id="description" name="description" rows={4} disabled={submitting} />
          </Field>
          <Field>
            <FieldLabel htmlFor="image_url">URL hình ảnh (không bắt buộc)</FieldLabel>
            <Input id="image_url" name="image_url" type="url" disabled={submitting} />
          </Field>
          <Button type="submit" disabled={submitting || loadingPois || pois.length === 0}>
            {submitting ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
