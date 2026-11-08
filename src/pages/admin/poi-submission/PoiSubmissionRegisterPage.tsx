import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { PoiCategory } from "../../../types/PoiCategory";
import useQuery from "#hooks/use-query";
import { publicService } from "../../../services/PublicService";
import { Label } from "#components/ui/label";
import { Textarea } from "#components/ui/textarea";
import { ImagePlusIcon, MapPinIcon, SendIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import type { MapCoordinates } from "../../../components/map/lib/map-type";
import HybridMap from "#components/map/HybridMap";
import { poiSubmissionService } from "../../../services/PoiSubmissionService";
import type { RegisterPoiSubmissionPayload } from "../../../types/PoiSubmission";
import { useNavigate } from "react-router";

type SelectedImage = {
  file: File;
  previewUrl: string;
};

const PoiSubmissionRegisterPage = () => {
  const navigate = useNavigate();
  const { execute, inProcess } = useQuery();
  const [isSubmitting, setSubmitting] = useState<boolean>(false);

  const [poiCategories, setPoiCatergories] = useState<PoiCategory[]>([]);

  const [location, setLocation] = useState<MapCoordinates | null>(null);
  const handleLocationSelect = useCallback((nextLocation: MapCoordinates) => {
    setLocation(nextLocation);
  }, []);

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const availableSlots = Math.max(0, 10 - selectedImages.length);
    const nextImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setSelectedImages((current) => [...current, ...nextImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    setSelectedImages((current) =>
      current.filter((image) => image.previewUrl !== previewUrl),
    );
  };

  const clearImages = () => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setSelectedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  // Radius
  const [radius, setRadius] = useState<number>(30);

  // When component is unmounted
  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!location) {
      window.alert("Vui lòng chọn vị trí trên bản đồ.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload: RegisterPoiSubmissionPayload = {
      category_id: String(formData.get("category_id") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      address: String(formData.get("address") ?? ""),
      location: {
        type: "Point",
        coordinates: location,
      },
      images: selectedImages.map(() => "https://anh.com"),
      trigger_radius: radius,
      owner_note: String(formData.get("owner_note") ?? ""),
    };

    setSubmitting(true);
    let createdSubmissionId: string | null = null;
    await execute(
      async () => {
        const response =
          await poiSubmissionService.RegisterPoiSubmission(payload);
        createdSubmissionId = response.data?.id ?? null;

        if (!createdSubmissionId) {
          throw new Error("Không nhận được mã đơn đăng ký từ hệ thống.");
        }
      },
      {
        onSuccess: () => {
          navigate(
            `/quan-ly/chuc-nang-chu-quan/don-dang-ky-poi?created=${createdSubmissionId}`,
            { replace: true },
          );
        },
        onError: (error) => window.alert(error.message),
      },
    );
    setSubmitting(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await execute(
        async () => {
          const poiCategoryPagination = await publicService.GetPoiCategory(
            "",
            1,
            100,
          );
          setPoiCatergories(poiCategoryPagination.data?.data || []);
        },
        {
          onSuccess: () => {},
          onError: () => {},
        },
      );
    };

    void fetchData();
  }, [execute]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Dành cho quản lý</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Đăng ký địa điểm mới
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Chọn chính xác vị trí trên bản đồ và cung cấp thông tin để gửi kiểm
          duyệt.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[minmax(22rem,0.8fr)_minmax(30rem,1.2fr)]"
      >
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
          <div className="grid gap-2">
            <Label htmlFor="poi-name">Tên quán/địa điểm</Label>
            <Input
              id="poi-name"
              name="name"
              minLength={2}
              maxLength={200}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="poi-category">Danh mục</Label>
            <select
              id="poi-category"
              name="category_id"
              required
              disabled={inProcess || isSubmitting}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue=""
            >
              <option value="" disabled>
                Chọn danh mục
              </option>
              {poiCategories.map((poiCategory) => (
                <option key={poiCategory.id} value={poiCategory.id}>
                  {poiCategory.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="poi-address">Địa chỉ</Label>
            <Input
              id="poi-address"
              name="address"
              minLength={5}
              maxLength={500}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="poi-description">Mô tả</Label>
            <Textarea
              id="poi-description"
              name="description"
              minLength={10}
              maxLength={2000}
              required
              rows={4}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="trigger-radius">Bán kính kích hoạt (m)</Label>
              <Input
                id="trigger-radius"
                name="trigger_radius"
                type="number"
                min={10}
                max={500}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Vị trí đã chọn</Label>
              <div className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs text-muted-foreground">
                <MapPinIcon className="size-3.5" />
                {location
                  ? `${location[1].toFixed(6)}, ${location[0].toFixed(6)}`
                  : "Chưa chọn"}
              </div>
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
                  onClick={clearImages}
                >
                  <Trash2Icon /> Xóa tất cả
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="poi-images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => addImages(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={selectedImages.length >= 10}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlusIcon /> Chọn ảnh từ máy ({selectedImages.length}/10)
            </Button>
            <p className="text-xs text-muted-foreground">
              Ảnh hiện chỉ được xem trước tại trình duyệt và chưa gửi lên
              server.
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
                      onClick={() => removeImage(image.previewUrl)}
                      className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 shadow hover:bg-background"
                      aria-label={`Xóa ảnh ${image.file.name}`}
                    >
                      <XIcon className="size-4" />
                    </button>
                    <figcaption className="truncate px-2 py-1 text-[0.7rem]">
                      {image.file.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="owner-note">Ghi chú cho quản trị viên</Label>
            <Textarea
              id="owner-note"
              name="owner_note"
              maxLength={1000}
              rows={3}
            />
          </div>

          <Button type="submit" size="lg" disabled={inProcess || isSubmitting}>
            <SendIcon aria-hidden="true" />
            {isSubmitting ? "Đang gửi…" : "Gửi đơn đăng ký"}
          </Button>
        </section>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <HybridMap
            className="h-210"
            selectedLocation={{ location: location ?? undefined, radius }}
            onClickMap={handleLocationSelect}
          />
        </div>
      </form>
    </div>
  );
};

export default PoiSubmissionRegisterPage;
