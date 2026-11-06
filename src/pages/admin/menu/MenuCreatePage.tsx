import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { menuItemService } from "../../../services/MenuItemService";
import { getApiErrorMessage } from "#lib/api";

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
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Thêm món ăn</h1>

      <Link to={`/quan-ly/dia-diem-poi/${poiId}/mon-an`}>
        Quay lại danh sách
      </Link>

      {error && <p role="alert">{error}</p>}

      <form onSubmit={submit}>
        <fieldset disabled={saving} className="space-y-4">
          <label className="block">
            Tên món
            <input
              className="block w-full rounded border p-2"
              name="name"
              required
              minLength={2}
              maxLength={120}
            />
          </label>

          <label className="block">
            Giá bán (VND)
            <input
              className="block w-full rounded border p-2"
              name="price"
              type="number"
              min="0"
              step="any"
            />
          </label>

          <label className="block">
            Mô tả
            <textarea
              className="block w-full rounded border p-2"
              name="description"
              maxLength={1000}
            />
          </label>

          <label className="block">
            URL ảnh
            <input
              className="block w-full rounded border p-2"
              name="image_url"
              type="url"
              maxLength={500}
            />
          </label>

          <label className="flex gap-2">
            <input name="is_available" type="checkbox" defaultChecked />
            Đang bán
          </label>

          <button className="rounded border px-4 py-2" type="submit">
            {saving ? "Đang lưu..." : "Lưu món ăn"}
          </button>
        </fieldset>
      </form>
    </div>
  );
}