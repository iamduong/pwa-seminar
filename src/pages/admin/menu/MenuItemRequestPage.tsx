import { type FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlusIcon, Loader2Icon, SendIcon, XIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router";

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
import type { MenuItem, OwnerPoiOption } from "../../../types/MenuItem";

export default function MenuItemRequestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [pois, setPois] = useState<OwnerPoiOption[]>([]);
  const [loadingPois, setLoadingPois] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage]);

  useEffect(() => {
    let cancelled = false;
    async function loadPois() {
      try {
        const [response, itemResponse] = await Promise.all([
          menuItemService.listMyPois(),
          id ? menuItemService.get(id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (!response.success || !response.data) throw new Error("Không thể tải POI.");
        if (id && (!itemResponse?.success || !itemResponse.data)) throw new Error("Không thể tải món ăn.");
        setPois(response.data);
        setItem(itemResponse?.data ?? null);
      } catch (requestError: unknown) {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Không thể tải thông tin thực đơn."));
      } finally {
        if (!cancelled) setLoadingPois(false);
      }
    }
    void loadPois();
    return () => { cancelled = true; };
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSuccess("");
    setNameError("");
    const formElement = event.currentTarget;
    if (!formElement.reportValidity()) return;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const poiId = String(form.get("poi_id") || "");
    if (name.length < 2) {
      setNameError("Vui lòng nhập tên món ăn.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        poi_id: poiId,
        name,
        description: String(form.get("description") || "").trim() || undefined,
        price: form.get("price") === "" ? undefined : Number(form.get("price")),
        // shortcut: selected images use a placeholder URL until the upload API is available.
        image_url: selectedImage ? "https://anh.com" : item?.image_url || undefined,
      };
      const response = id
        ? await menuItemService.update(id, payload)
        : await menuItemService.submit(payload);
      if (!response.success) throw new Error("Không thể lưu món ăn.");
      if (!id) {
        navigate("/quan-ly/chuc-nang-chu-quan/thuc-don-cua-toi", { replace: true });
      } else {
        if (response.data) setItem(response.data);
        setSuccess("Đã lưu thay đổi, món ăn chờ admin duyệt lại.");
      }
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
        <h1 className="mt-1 text-2xl font-semibold">{id ? "Chỉnh sửa món ăn" : "Thêm món ăn"}</h1>
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
      {loadingPois && <p role="status">Đang tải...</p>}
      {!loadingPois && (id ? item?.id === id : !item) && <form key={item?.id ?? "new"} className="rounded-xl border bg-card p-5 shadow-sm" onSubmit={submit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="poi_id">Địa điểm</FieldLabel>
            <select id="poi_id" name="poi_id" defaultValue={item?.poi_id ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm" required disabled={loadingPois || submitting}>
              <option value="">{loadingPois ? "Đang tải..." : "Chọn địa điểm"}</option>
              {pois.map((poi) => <option key={poi.id} value={poi.id}>{poi.name}</option>)}
            </select>
          </Field>
          <Field data-invalid={Boolean(nameError)}>
            <FieldLabel htmlFor="name">Tên món ăn</FieldLabel>
            <Input id="name" name="name" defaultValue={item?.name} required minLength={2} maxLength={120} placeholder="Ví dụ: Cơm tấm sườn" disabled={submitting} />
            <FieldError>{nameError}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="price">Giá bán (VNĐ)</FieldLabel>
            <Input id="price" name="price" defaultValue={item?.price ?? ""} type="number" min="0" step="any" disabled={submitting} />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Mô tả</FieldLabel>
            <Textarea id="description" name="description" defaultValue={item?.description ?? ""} maxLength={1000} rows={4} disabled={submitting} />
          </Field>
          <Field>
            <FieldLabel htmlFor="image">Hình ảnh (không bắt buộc)</FieldLabel>
            <input
              ref={fileInputRef}
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={submitting}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/") || file.size === 0) {
                  setError("Vui lòng chọn tệp hình ảnh hợp lệ.");
                  event.target.value = "";
                  return;
                }
                setError("");
                setSelectedImage({ file, previewUrl: URL.createObjectURL(file) });
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={submitting}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlusIcon aria-hidden="true" />
              {selectedImage ? "Chọn ảnh khác" : "Chọn ảnh từ máy"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Ảnh được chọn chỉ xem trước tại trình duyệt, chưa được tải lên máy chủ.
            </p>
            {item?.image_url && !selectedImage && (
              <p className="text-sm text-muted-foreground">
                Đã có thông tin ảnh. Chọn tệp mới để thay thế.
              </p>
            )}
            {selectedImage && (
              <figure className="relative w-full max-w-xs overflow-hidden rounded-lg border bg-muted">
                <img
                  src={selectedImage.previewUrl}
                  alt={selectedImage.file.name}
                  className="h-40 w-full object-cover"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="absolute top-2 right-2 rounded-full bg-background/90"
                  aria-label={`Xóa ảnh ${selectedImage.file.name}`}
                  disabled={submitting}
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <XIcon aria-hidden="true" />
                </Button>
                <figcaption className="truncate px-2 py-1 text-xs">
                  {selectedImage.file.name}
                </figcaption>
              </figure>
            )}
          </Field>
          <Button type="submit" disabled={submitting || loadingPois || pois.length === 0}>
            {submitting ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
            {submitting ? "Đang lưu..." : id ? "Lưu thay đổi" : "Thêm món ăn"}
          </Button>
        </FieldGroup>
      </form>}
    </div>
  );
}
