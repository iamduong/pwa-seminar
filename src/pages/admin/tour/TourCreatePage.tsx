import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  Loader2Icon,
  MapPinIcon,
  SaveIcon,
  SearchIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Checkbox } from "#components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import { getApiErrorMessage } from "#lib/api";
import { tourService } from "../../../services/TourService";
import type { TourPoi } from "../../../types/Tour";

const LIST_PATH = "/quan-ly/tour/danh-sach";

export default function TourCreatePage() {
  const navigate = useNavigate();
  const [price, setPrice] = useState("");
  const [maxPeople, setMaxPeople] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [pois, setPois] = useState<TourPoi[]>([]);
  const [selectedPoiIds, setSelectedPoiIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPois() {
      try {
        const response = await tourService.listPoiOptions(controller.signal);
        if (!response.success || !response.data) throw new Error(response.message);
        if (!controller.signal.aborted) setPois(response.data);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setRequestError(getApiErrorMessage(error, "Không thể tải danh sách POI."));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadPois();
    return () => controller.abort();
  }, []);

  const filteredPois = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    if (!keyword) return pois;
    return pois.filter((poi) =>
      `${poi.name} ${poi.address}`.toLocaleLowerCase("vi").includes(keyword),
    );
  }, [pois, query]);

  function togglePoi(id: string, checked: boolean) {
    setSelectedPoiIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((value) => value !== id),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setRequestError(null);

    const numericPrice = Number(price);
    const numericMaxPeople = Number(maxPeople);
    const expiration = new Date(expiresAt);
    if (!price || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setFormError("Giá tour phải là số không âm.");
      return;
    }
    if (!Number.isInteger(numericMaxPeople) || numericMaxPeople <= 0) {
      setFormError("Số lượng người tối đa phải là số nguyên dương.");
      return;
    }
    if (!expiresAt || Number.isNaN(expiration.getTime()) || expiration <= new Date()) {
      setFormError("Ngày hết hạn phải ở tương lai.");
      return;
    }
    if (selectedPoiIds.length === 0) {
      setFormError("Vui lòng chọn ít nhất một điểm POI cho tour.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await tourService.create({
        price,
        max_people: numericMaxPeople,
        expires_at: expiration.toISOString(),
        poi_ids: selectedPoiIds,
      });
      if (!response.success || !response.data) throw new Error(response.message);
      navigate(LIST_PATH, { replace: true });
    } catch (error: unknown) {
      setRequestError(getApiErrorMessage(error, "Không thể tạo tour."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          className="-ml-2 mb-3"
          render={<Link to={LIST_PATH} />}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Danh sách tour
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Tạo tour mới</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mã tour được hệ thống sinh tự động sau khi lưu.
        </p>
      </header>

      {(requestError || formError) && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể tạo tour</AlertTitle>
          <AlertDescription>{requestError || formError}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-6" onSubmit={submit} noValidate>
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Thông tin tour</h2>
          <FieldGroup className="mt-5 grid gap-5 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="tour-price">Giá tiền (VND)</FieldLabel>
              <Input
                id="tour-price"
                type="number"
                min="0"
                step="1000"
                value={price}
                placeholder="Ví dụ: 250000"
                disabled={submitting}
                onChange={(event) => setPrice(event.target.value)}
              />
              <FieldDescription>Số tiền dùng để tạo VietQR.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="tour-max-people">Số người tối đa</FieldLabel>
              <Input
                id="tour-max-people"
                type="number"
                min="1"
                step="1"
                value={maxPeople}
                disabled={submitting}
                onChange={(event) => setMaxPeople(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="tour-expires-at">Ngày hết hạn</FieldLabel>
              <Input
                id="tour-expires-at"
                type="datetime-local"
                value={expiresAt}
                disabled={submitting}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">Điểm POI trong tour</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Đã chọn {selectedPoiIds.length}/{pois.length} địa điểm.
                </p>
              </div>
              <div className="relative sm:w-80">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query}
                  placeholder="Tìm tên hoặc địa chỉ POI"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="max-h-[30rem] divide-y overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" /> Đang tải POI...
              </div>
            )}
            {!loading && filteredPois.length === 0 && (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Không có POI phù hợp.
              </p>
            )}
            {!loading && filteredPois.map((poi) => (
              <label key={poi.id} className="flex cursor-pointer items-start gap-3 p-4 hover:bg-muted/40">
                <Checkbox
                  checked={selectedPoiIds.includes(poi.id)}
                  disabled={submitting}
                  onCheckedChange={(checked) => togglePoi(poi.id, checked)}
                />
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block font-medium">{poi.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{poi.address}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-2">
          <Button nativeButton={false} variant="outline" render={<Link to={LIST_PATH} />} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            {submitting ? "Đang tạo..." : "Tạo tour"}
          </Button>
        </div>
      </form>
    </div>
  );
}
