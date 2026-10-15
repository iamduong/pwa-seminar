import { useEffect, useMemo, useState } from "react"
import { AlertCircleIcon, ArrowLeftIcon, CheckIcon, StoreIcon, XIcon } from "lucide-react"
import { Link, useParams } from "react-router"

import HybridMap from "#components/map/HybridMap"
import type { MapPoi } from "../../components/map/types"
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { Textarea } from "#components/ui/textarea"
import { getApiErrorMessage } from "#lib/api"
import { poiSubmissionService, type PoiSubmission } from "../../services/PoiSubmissionService"

const STATUS_META = {
  pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Từ chối", className: "bg-red-100 text-red-800" },
} as const

export function PoiRegistrationDetailPage() {
  const { submissionId = "" } = useParams()
  const [submission, setSubmission] = useState<PoiSubmission | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    poiSubmissionService.getAdminSubmission(submissionId, controller.signal).then((response) => {
      if (!response.success || !response.data) throw new Error("Invalid response")
      setSubmission(response.data)
      setAdminNote(response.data.admin_note ?? "")
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setErrorMessage(getApiErrorMessage(error, "Không thể tải chi tiết đơn."))
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [submissionId])

  const mapPois = useMemo<MapPoi[]>(() => submission ? [{
    id: submission.id,
    name: submission.name,
    categoryCode: submission.category.code,
    coordinates: submission.location.coordinates,
    address: submission.address,
  }] : [], [submission])

  async function review(status: "approved" | "rejected") {
    if (!submission) return
    if (status === "rejected" && !adminNote.trim()) {
      setErrorMessage("Vui lòng nhập lý do từ chối đơn.")
      return
    }
    setReviewing(true)
    setErrorMessage(null)
    try {
      const response = await poiSubmissionService.review(submission.id, status, adminNote.trim())
      if (!response.success || !response.data) throw new Error("Invalid response")
      setSubmission(response.data)
      setAdminNote(response.data.admin_note ?? "")
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, "Không thể xử lý đơn đăng ký."))
    } finally {
      setReviewing(false)
    }
  }

  if (loading) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Đang tải chi tiết đơn…</div>
  if (!submission) return <Alert variant="destructive"><AlertCircleIcon /><AlertTitle>Không thể hiển thị đơn</AlertTitle><AlertDescription>{errorMessage ?? "Không tìm thấy đơn đăng ký."}</AlertDescription></Alert>

  return (
    <div className="space-y-6">
      <div><Button variant="ghost" render={<Link to="/poi-registrations" />} className="mb-3"><ArrowLeftIcon /> Quay lại danh sách</Button><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Chi tiết đơn đăng ký</p><h1 className="text-2xl font-semibold">{submission.name}</h1></div><span className={`rounded-full px-3 py-1 text-sm ${STATUS_META[submission.status].className}`}>{STATUS_META[submission.status].label}</span></div></div>
      {errorMessage && <Alert variant="destructive"><AlertCircleIcon /><AlertTitle>Không thể hoàn tất</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert>}

      <div className="grid gap-6 xl:grid-cols-[minmax(24rem,0.85fr)_minmax(30rem,1.15fr)]">
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2"><StoreIcon className="size-4" /><h2 className="font-semibold">Thông tin chủ quán cung cấp</h2></div>
          <Detail label="Tên địa điểm" value={submission.name} />
          <Detail label="Danh mục" value={submission.category.name} />
          <Detail label="Địa chỉ" value={submission.address} />
          <Detail label="Mô tả" value={submission.description} />
          <Detail label="Chủ quán" value={`${submission.owner.full_name}\n${submission.owner.email}\n${submission.owner.phone}`} />
          <Detail label="Tọa độ" value={`${submission.location.coordinates[1]}, ${submission.location.coordinates[0]}`} />
          <Detail label="Bán kính kích hoạt" value={`${submission.trigger_radius} m`} />
          <Detail label="Ghi chú chủ quán" value={submission.owner_note || "Không có"} />
          {submission.images.length > 0 && <div className="grid grid-cols-2 gap-2">{submission.images.map((image) => <img key={image} src={image} alt={submission.name} className="h-28 w-full rounded-lg border object-cover" />)}</div>}
        </section>

        <div className="space-y-6">
          <HybridMap className="h-[28rem]" initialCenter={submission.location.coordinates} initialZoom={16} pois={mapPois} selectedPoiId={submission.id} showLegend={false} />
          <section className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
            <div><h2 className="font-semibold">Kết quả kiểm duyệt</h2><p className="text-sm text-muted-foreground">Kiểm tra thông tin và vị trí trên bản đồ trước khi quyết định.</p></div>
            <label className="grid gap-2 text-sm"><span className="font-medium">Ghi chú quản trị {submission.status === "pending" && "(bắt buộc khi từ chối)"}</span><Textarea rows={4} maxLength={1000} value={adminNote} disabled={submission.status !== "pending" || reviewing} onChange={(event) => setAdminNote(event.target.value)} /></label>
            {submission.status === "pending" ? <div className="flex justify-end gap-2"><Button variant="destructive" disabled={reviewing} onClick={() => void review("rejected")}><XIcon /> Từ chối</Button><Button disabled={reviewing} onClick={() => void review("approved")}><CheckIcon /> Chấp nhận</Button></div> : <div className={`rounded-lg px-3 py-2 text-sm ${STATUS_META[submission.status].className}`}>{STATUS_META[submission.status].label}{submission.admin_note && <p className="mt-1 text-xs">{submission.admin_note}</p>}</div>}
          </section>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-line text-sm leading-6">{value}</p></div>
}
