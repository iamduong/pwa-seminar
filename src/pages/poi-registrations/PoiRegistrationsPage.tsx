import { useEffect, useState, type FormEvent } from "react"
import { AlertCircleIcon, EyeIcon, FilterIcon, InboxIcon, RefreshCwIcon } from "lucide-react"
import { Link } from "react-router"

import { DataPagination } from "#components/DataPagination"
import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert"
import { Button } from "#components/ui/button"
import { Input } from "#components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/ui/table"
import { getApiErrorMessage } from "#lib/api"
import {
  poiSubmissionService,
  type PoiCategory,
  type PoiSubmissionPagination,
  type PoiSubmissionStatus,
} from "../../services/PoiSubmissionService"

const STATUS_META = {
  pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Từ chối", className: "bg-red-100 text-red-800" },
} as const

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" })

interface AppliedFilters {
  status: PoiSubmissionStatus | "all"
  address: string
  categoryId: string
}

export default function PoiRegistrationsPage() {
  const [categories, setCategories] = useState<PoiCategory[]>([])
  const [data, setData] = useState<PoiSubmissionPagination | null>(null)
  const [filters, setFilters] = useState<AppliedFilters>({ status: "pending", address: "", categoryId: "" })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    poiSubmissionService.getCategories(controller.signal).then((response) => {
      if (response.success && response.data) setCategories(response.data)
    }).catch(() => undefined)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    poiSubmissionService.getAdminSubmissions({
      page,
      page_size: pageSize,
      status: filters.status === "all" ? undefined : filters.status,
      address: filters.address || undefined,
      category_id: filters.categoryId || undefined,
    }, controller.signal).then((response) => {
      if (!response.success || !response.data) throw new Error("Invalid response")
      setData(response.data)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setErrorMessage(getApiErrorMessage(error, "Không thể tải danh sách đơn đăng ký."))
        setData(null)
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [filters, page, pageSize, requestVersion])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setErrorMessage(null)
    setPage(1)
    setFilters({
      status: String(form.get("status")) as PoiSubmissionStatus | "all",
      address: String(form.get("address") ?? "").trim(),
      categoryId: String(form.get("category_id") ?? ""),
    })
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Đơn đăng ký địa điểm</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tìm kiếm và xử lý các đơn đăng ký POI của chủ quán.</p>
        </div>
        <Button variant="outline" disabled={loading} onClick={() => {
          setLoading(true)
          setErrorMessage(null)
          setRequestVersion((value) => value + 1)
        }}>
          <RefreshCwIcon className={loading ? "animate-spin" : ""} /> Làm mới
        </Button>
      </header>

      <form onSubmit={applyFilters} className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-[11rem_minmax(12rem,1fr)_14rem_auto] md:items-end">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Trạng thái</span>
          <select name="status" defaultValue={filters.status} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
            <option value="pending">Chưa được duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="all">Tất cả</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Địa chỉ</span>
          <Input name="address" defaultValue={filters.address} placeholder="Đường, phường, quận…" />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Danh mục</span>
          <select name="category_id" defaultValue={filters.categoryId} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm">
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <Button type="submit" disabled={loading}><FilterIcon /> Lọc đơn</Button>
      </form>

      {errorMessage && <Alert variant="destructive"><AlertCircleIcon /><AlertTitle>Không thể tải dữ liệu</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert>}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3"><h2 className="font-semibold">Danh sách đơn</h2><p className="text-xs text-muted-foreground">{data?.total_items ?? 0} kết quả</p></div>
        <Table>
          <TableHeader><TableRow><TableHead className="pl-4">Địa điểm</TableHead><TableHead>Chủ quán</TableHead><TableHead>Danh mục</TableHead><TableHead>Địa chỉ</TableHead><TableHead>Ngày gửi</TableHead><TableHead>Trạng thái</TableHead><TableHead className="pr-4 text-right">Thao tác</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">Đang tải đơn đăng ký…</TableCell></TableRow>}
            {!loading && (data?.items.length ?? 0) === 0 && <TableRow><TableCell colSpan={7} className="h-64 text-center"><InboxIcon className="mx-auto mb-2 size-8 text-muted-foreground" /><p className="font-medium">Không tìm thấy đơn đăng ký</p><p className="text-sm text-muted-foreground">Hãy thử thay đổi điều kiện lọc.</p></TableCell></TableRow>}
            {!loading && data?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="pl-4 font-medium">{item.name}</TableCell>
                <TableCell><p>{item.owner.full_name}</p><p className="text-xs text-muted-foreground">{item.owner.phone}</p></TableCell>
                <TableCell>{item.category.name}</TableCell>
                <TableCell className="max-w-64"><p className="line-clamp-2">{item.address}</p></TableCell>
                <TableCell>{dateFormatter.format(new Date(item.created_at))}</TableCell>
                <TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_META[item.status].className}`}>{STATUS_META[item.status].label}</span></TableCell>
                <TableCell className="pr-4 text-right"><Button variant="ghost" size="sm" render={<Link to={`/quan-ly/duyet-don-poi/${item.id}`} />}><EyeIcon /> Chi tiết</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataPagination
          page={data?.page ?? page}
          pageSize={pageSize}
          totalItems={data?.total_items ?? 0}
          totalPages={data?.total_pages ?? 0}
          disabled={loading}
          onPageChange={(nextPage) => { setLoading(true); setPage(nextPage) }}
          onPageSizeChange={(nextSize) => { setLoading(true); setPage(1); setPageSize(nextSize) }}
        />
      </section>
    </div>
  )
}
