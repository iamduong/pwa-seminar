import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  ImagePlusIcon,
  MapPinIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import HybridMap from "#components/map/HybridMap";
import type { MapCoordinates } from "../../../components/map/lib/map-type";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";
import { Switch } from "#components/ui/switch";
import { Textarea } from "#components/ui/textarea";
import { getApiErrorMessage } from "#lib/api";
import { poiService } from "../../../services/PoiService";
import { publicService } from "../../../services/PublicService";
import type { CreateAdminPoiPayload } from "../../../types/Poi";
import type { PoiCategory } from "../../../types/PoiCategory";

const LIST_PATH = "/quan-ly/dia-diem-poi/danh-sach-poi";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type SelectedImage = {
  file: File;
  previewUrl: string;
};

export default function PoiCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<PoiCategory[]>([]);
  const [location, setLocation] = useState<MapCoordinates | null>(null);
  const [radius, setRadius] = useState(30);
  const [activationRequested, setActivationRequested] = useState(true);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectLocation = useCallback((coordinates: MapCoordinates) => {
    setLocation(coordinates);
  }, []);

  function addImages(files: FileList | null) {
    if (!files) return;
    const candidates = Array.from(files);
    const invalid = candidates.find(
      (file) => !file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE,
    );
    if (invalid) {
      setErrorMessage(`Ảnh ${invalid.name} không hợp lệ hoặc vượt quá 5 MB.`);
    }

    const availableSlots = Math.max(0, 10 - selectedImages.length);
    const nextImages = candidates
      .filter((file) => file.type.startsWith("image/") && file.size <= MAX_IMAGE_SIZE)
      .slice(0, availableSlots)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setSelectedImages((current) => [...current, ...nextImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(previewUrl: string) {
    URL.revokeObjectURL(previewUrl);
    setSelectedImages((current) =>
      current.filter((image) => image.previewUrl !== previewUrl),
    );
  }

  function clearImages() {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(
    () => () => {
      selectedImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const response = await publicService.GetPoiCategory("", 1, 100);
        if (!controller.signal.aborted) setCategories(response.data?.data ?? []);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setErrorMessage(getApiErrorMessage(error, "Không thể tải danh mục POI."));
        }
      } finally {
        if (!controller.signal.aborted) setLoadingCategories(false);
      }
    }

    void loadCategories();
    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!location) {
      setErrorMessage("Vui lòng chọn vị trí POI trên bản đồ.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const uploadResponse = await poiService.uploadImages(
          selectedImages.map((image) => image.file),
        );
        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error(uploadResponse.message || "Không thể tải ảnh POI.");
        }
        imageUrls = uploadResponse.data;
      }

      const payload: CreateAdminPoiPayload = {
        category_id: String(formData.get("category_id") ?? ""),
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        address: String(formData.get("address") ?? "").trim(),
        location: { type: "Point", coordinates: location },
        images: imageUrls,
        trigger_radius: radius,
        audio_priority: Number(formData.get("audio_priority") ?? 100),
        activation_requested: activationRequested,
      };
      const response = await poiService.createAdminPoi(payload);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Không nhận được dữ liệu POI.");
      }
      navigate(`${LIST_PATH}?created=${response.data.id}`, { replace: true });
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, "Không thể tạo POI."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <Button variant="ghost" render={<Link to={LIST_PATH} />} className="mb-3">
          <ArrowLeftIcon aria-hidden="true" />
          Quay lại danh sách
        </Button>
        <p className="text-sm text-muted-foreground">Quản trị nội dung</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Thêm POI trực tiếp</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          POI được tạo ngay, không thông qua đơn đăng ký hoặc thao tác kiểm duyệt.
        </p>
      </header>

      <Alert>
        <CheckCircle2Icon aria-hidden="true" />
        <AlertTitle>Quy trình xử lý tự động</AlertTitle>
        <AlertDescription>
          Sau khi tạo, hệ thống tự động dịch nội dung và tạo audio cho các ngôn ngữ hỗ trợ.
          Nếu bật kích hoạt, POI sẽ xuất hiện công khai khi xử lý hoàn tất.
        </AlertDescription>
      </Alert>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tạo POI</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[minmax(22rem,0.8fr)_minmax(30rem,1.2fr)]"
      >
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
          <div className="grid gap-2">
            <Label htmlFor="poi-name">Tên địa điểm</Label>
            <Input id="poi-name" name="name" minLength={2} maxLength={200} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="poi-category">Danh mục</Label>
            <select
              id="poi-category"
              name="category_id"
              required
              disabled={loadingCategories || submitting}
              defaultValue=""
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                {loadingCategories ? "Đang tải danh mục…" : "Chọn danh mục"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="poi-address">Địa chỉ</Label>
            <Input id="poi-address" name="address" minLength={5} maxLength={500} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="poi-description">Mô tả gốc</Label>
            <Textarea
              id="poi-description"
              name="description"
              minLength={10}
              maxLength={5000}
              rows={5}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="trigger-radius">Bán kính kích hoạt (m)</Label>
              <Input
                id="trigger-radius"
                type="number"
                min={10}
                max={500}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audio-priority">Độ ưu tiên audio</Label>
              <Input
                id="audio-priority"
                name="audio_priority"
                type="number"
                min={1}
                max={1000}
                defaultValue={100}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Vị trí đã chọn</Label>
            <div className="flex h-9 items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground">
              <MapPinIcon className="size-4" aria-hidden="true" />
              {location
                ? `${location[1].toFixed(6)}, ${location[0].toFixed(6)}`
                : "Nhấn lên bản đồ để chọn vị trí"}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="poi-images">Hình ảnh địa điểm</Label>
              {selectedImages.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={submitting}
                  onClick={clearImages}
                >
                  <Trash2Icon aria-hidden="true" />
                  Xóa tất cả
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="poi-images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              disabled={submitting}
              onChange={(event) => addImages(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={submitting || selectedImages.length >= 10}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlusIcon aria-hidden="true" />
              Chọn ảnh từ máy ({selectedImages.length}/10)
            </Button>
            <p className="text-xs text-muted-foreground">
              Hỗ trợ JPEG, PNG, WebP, GIF; tối đa 5 MB mỗi ảnh và 10 ảnh.
            </p>
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedImages.map((image) => (
                  <figure
                    key={image.previewUrl}
                    className="group relative overflow-hidden rounded-lg border bg-muted"
                  >
                    <img
                      src={image.previewUrl}
                      alt={image.file.name}
                      className="h-28 w-full object-cover"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => removeImage(image.previewUrl)}
                      className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 shadow hover:bg-background disabled:opacity-50"
                      aria-label={`Xóa ảnh ${image.file.name}`}
                    >
                      <XIcon className="size-4" aria-hidden="true" />
                    </button>
                    <figcaption className="truncate px-2 py-1 text-[0.7rem]">
                      {image.file.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="activation-requested">Tự động kích hoạt</Label>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Công khai POI sau khi dịch và tạo audio hoàn tất thành công.
              </p>
            </div>
            <Switch
              id="activation-requested"
              checked={activationRequested}
              onCheckedChange={setActivationRequested}
              disabled={submitting}
            />
          </div>

          <Button type="submit" size="lg" disabled={submitting || loadingCategories}>
            <PlusIcon aria-hidden="true" />
            {submitting ? "Đang tạo POI…" : "Tạo POI trực tiếp"}
          </Button>
        </section>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <HybridMap
            className="h-210"
            isSupportLocation
            selectedLocation={{ location: location ?? undefined, radius }}
            onClickMap={selectLocation}
          />
        </div>
      </form>
    </div>
  );
}
