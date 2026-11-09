import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { menuItemService } from "../../../services/MenuItemService";
import { getApiErrorMessage } from "#lib/api";
import { AlertCircleIcon, ArrowLeftIcon, Loader2Icon, SaveIcon, UtensilsIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Textarea } from "#components/ui/textarea";

export default function MenuCreatePage() {
  const { poiId } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!poiId || saving) return;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const rawPrice = String(form.get("price") ?? "").trim();
    const price = rawPrice === "" ? null : Number(rawPrice);

    if (name.length < 2) {
      setError("Tên món cần ít nhất 2 ký tự.");
      return;
    }

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setError("Giá bán không hợp lệ.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await menuItemService.createDirect(poiId, {
        name,
        description: String(form.get("description") ?? "").trim() || null,
        price,
        image_url: String(form.get("image_url") ?? "").trim() || null,
        is_available: form.get("is_available") === "on",
      });

      if (!response.success) {
        setError(response.message);
        return;
      }

      navigate(`/quan-ly/dia-diem-poi/${poiId}/mon-an`);
    } catch (error) {
      setError(getApiErrorMessage(error, "Không thể thêm món ăn"));
    } finally {
      setSaving(false);
    }
  }

  if (!poiId) return <p>Chưa chọn địa điểm.</p>;

  return (
    <div className="max-w-3xl space-y-6">

      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-ring" to={`/quan-ly/dia-diem-poi/${poiId}/mon-an`}>
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Danh sách món ăn
      </Link>
      <header>
        <p className="text-sm text-muted-foreground">Quản lý địa điểm POI</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Thêm món ăn</h1>
        <p className="mt-2 text-sm text-muted-foreground">Nhập thông tin và trạng thái bán cho món ăn tại địa điểm này.</p>
      </header>

      {error && <Alert variant="destructive">
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>Không thể thêm món ăn</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>}

      <form onSubmit={submit} className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-busy={saving}>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <UtensilsIcon className="size-4" aria-hidden="true" />
          <h2 className="font-semibold">Thông tin món ăn</h2>
        </div>
        <fieldset disabled={saving} className="space-y-5 p-4 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Tên món <span className="text-destructive">*</span></span>
            <Input
              placeholder="Ví dụ: Phở bò đặc biệt"
              name="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            Giá bán (VND)
            <Input
              placeholder="Ví dụ: 65000"
              name="price"
              type="number"
              min="0"
              step="any"
            />
          </label>
          </div>

          <label className="block space-y-2 text-sm font-medium">
            Mô tả
            <Textarea
              rows={4}
              placeholder="Giới thiệu nguyên liệu, hương vị hoặc đặc điểm của món ăn..."
              name="description"
              maxLength={1000}
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            URL ảnh
            <Input
              placeholder="https://example.com/mon-an.jpg"
              name="image_url"
              type="url"
              maxLength={500}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <input className="mt-0.5 size-4 accent-primary focus-visible:outline-ring" name="is_available" type="checkbox" defaultChecked />
            <span><span className="block text-sm font-medium">Đang bán</span>
              <span className="mt-1 block text-sm text-muted-foreground">Bỏ chọn nếu món ăn đang tạm ngưng phục vụ.</span>
            </span>
          </label>
          <p className="text-xs text-muted-foreground">Tên món là bắt buộc. Các thông tin giá bán, mô tả và ảnh có thể bổ sung sau.</p>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-4 sm:px-6">
          <Button type="button" variant="outline" disabled={saving} onClick={() => navigate(`/quan-ly/dia-diem-poi/${poiId}/mon-an`)}>Hủy</Button>
          <Button disabled={saving} type="submit">
            {saving ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <SaveIcon aria-hidden="true" />}
            {saving ? "Đang lưu..." : "Lưu món ăn"}
          </Button>
        </div>
      </form>
    </div>
  );
}
