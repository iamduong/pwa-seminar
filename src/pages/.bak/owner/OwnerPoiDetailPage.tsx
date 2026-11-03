import { useEffect, useMemo, useState } from "react"
import { AlertCircleIcon, ArrowLeftIcon, ImageIcon, MapPinIcon, UtensilsIcon } from "lucide-react"
import { Link, useParams } from "react-router"

import HybridMap from "#components/map/HybridMap"
import type { MapPoi } from "../../components/map/types"
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { getApiErrorMessage } from "#lib/api"
import {
  poiSubmissionService,
  type OwnerPoi,
} from "../../services/PoiSubmissionService"

const DEMO_MENU = [
  { id: "demo-1", name: "Món đặc trưng của quán", description: "Món bán chạy được khách hàng yêu thích.", price: 55000 },
  { id: "demo-2", name: "Combo trải nghiệm", description: "Combo dành cho khách du lịch lần đầu ghé quán.", price: 99000 },
  { id: "demo-3", name: "Đồ uống địa phương", description: "Thức uống dùng kèm được đề xuất.", price: 30000 },
]

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
})

export function OwnerPoiDetailPage() {
  const { poiId = "" } = useParams()
  const [poi, setPoi] = useState<OwnerPoi | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    poiSubmissionService
      .getOwnerPoi(poiId, controller.signal)
      .then((response) => {
        if (!response.success || !response.data) throw new Error("Invalid response")
        setPoi(response.data)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErrorMessage(getApiErrorMessage(error, "Không thể tải thông tin cơ sở."))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [poiId])

  const mapPois = useMemo<MapPoi[]>(() => poi ? [{
    id: poi.id,
    name: poi.name,
    categoryCode: poi.category.code,
    coordinates: poi.location.coordinates,
    address: poi.address,
  }] : [], [poi])

  if (loading) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Đang tải thông tin cơ sở…</div>

  if (!poi || errorMessage) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Không thể hiển thị cơ sở</AlertTitle>
        <AlertDescription>{errorMessage ?? "Không tìm thấy cơ sở."}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" render={<Link to="/owner/pois" />} className="mb-3">
          <ArrowLeftIcon /> Quay lại danh sách
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{poi.category.name}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{poi.name}</h1>
            <p className="mt-2 flex gap-1.5 text-sm text-muted-foreground"><MapPinIcon className="size-4" />{poi.address}</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-sm ${poi.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
            {poi.is_active ? "Đang hoạt động" : "Đang tạm ẩn"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Thông tin cơ sở</h2>
          <Detail label="Mô tả" value={poi.description} />
          <Detail label="Danh mục" value={poi.category.name} />
          <Detail label="Địa chỉ" value={poi.address} />
          <Detail label="Tọa độ" value={`${poi.location.coordinates[1]}, ${poi.location.coordinates[0]}`} />
          <Detail label="Bán kính kích hoạt" value={`${poi.trigger_radius} m`} />
          <Detail label="Trạng thái âm thanh" value={poi.audio_status} />

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Hình ảnh</p>
            {poi.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {poi.images.map((image) => <img key={image} src={image} alt={poi.name} className="h-32 w-full rounded-lg border object-cover" />)}
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground"><ImageIcon /> Chưa có hình ảnh</div>
            )}
          </div>
        </section>

        <HybridMap
          className="h-136"
          initialCenter={poi.location.coordinates}
          initialZoom={16}
          pois={mapPois}
          selectedPoiId={poi.id}
          showLegend={false}
        />
      </div>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <UtensilsIcon className="size-4" />
          <div>
            <h2 className="font-semibold">Thực đơn tại quán</h2>
            <p className="text-xs text-muted-foreground">Dữ liệu demo — sẽ được thay bằng API thực đơn.</p>
          </div>
        </div>
        <div className="divide-y">
          {DEMO_MENU.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
              <div><p className="font-medium">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>
              <p className="shrink-0 font-medium">{currencyFormatter.format(item.price)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-line text-sm leading-6">{value}</p></div>
}
