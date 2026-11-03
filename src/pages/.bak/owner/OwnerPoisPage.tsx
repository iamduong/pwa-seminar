import { useEffect, useState } from "react"
import { AlertCircleIcon, MapPinIcon, PlusIcon, StoreIcon } from "lucide-react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { getApiErrorMessage } from "#lib/api"
import {
  poiSubmissionService,
  type OwnerPoi,
} from "../../services/PoiSubmissionService"

export function OwnerPoisPage() {
  const [pois, setPois] = useState<OwnerPoi[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    poiSubmissionService
      .getOwnerPois(controller.signal)
      .then((response) => {
        if (!response.success || !response.data) throw new Error("Invalid response")
        setPois(response.data)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErrorMessage(getApiErrorMessage(error, "Không thể tải danh sách cơ sở."))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Dành cho quản lý</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Cơ sở du lịch</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý các địa điểm đã được phê duyệt và thông tin thực đơn.
          </p>
        </div>
        <Button render={<Link to="/owner/pois/new" />}>
          <PlusIcon /> Đăng ký địa điểm mới
        </Button>
      </header>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Không thể tải dữ liệu</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Đang tải danh sách cơ sở…</div>
      ) : pois.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
          <StoreIcon className="mb-3 size-10 text-muted-foreground" />
          <h2 className="font-semibold">Chưa có cơ sở nào</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Các đơn được quản trị viên chấp nhận sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pois.map((poi) => (
            <Link
              key={poi.id}
              to={`/owner/pois/${poi.id}`}
              className="group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {poi.images[0] ? (
                <img src={poi.images[0]} alt={poi.name} className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center bg-muted"><StoreIcon className="size-10 text-muted-foreground" /></div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold group-hover:underline">{poi.name}</h2>
                    <p className="text-xs text-muted-foreground">{poi.category.name}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${poi.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    {poi.is_active ? "Hoạt động" : "Tạm ẩn"}
                  </span>
                </div>
                <p className="mt-3 flex gap-1.5 text-sm text-muted-foreground">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                  <span className="line-clamp-2">{poi.address}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
