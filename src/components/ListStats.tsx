import { Skeleton } from "#components/ui/skeleton";

interface Stat { label: string; value: number }
interface Props {
  total: number;
  visible: number;
  pages?: number;
  loading: boolean;
  error?: boolean;
  totalLabel?: string;
  extra?: Stat[];
}

export function ListStats({ total, visible, pages, loading, error, totalLabel = "Kết quả theo bộ lọc", extra = [] }: Props) {
  const stats: Stat[] = [
    { label: totalLabel, value: total },
    { label: "Bản ghi đang hiển thị", value: visible },
    ...(pages === undefined ? [] : [{ label: "Tổng số trang", value: pages }]),
    ...extra,
  ];
  return <section aria-label="Thống kê danh sách" aria-busy={loading} className="rounded-xl border bg-card shadow-sm">
    <dl className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
      {stats.map((stat) => <div key={stat.label} className="min-w-0">
        <dt className="text-sm text-muted-foreground">{stat.label}</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums">
          {loading ? <Skeleton className="h-8 w-16" /> : error ? <span aria-label="Chưa có dữ liệu">—</span> : stat.value.toLocaleString("vi-VN")}
        </dd>
      </div>)}
    </dl>
    {error && <p className="px-4 pb-3 text-xs text-muted-foreground">Chưa thể tải thống kê. Hãy thử làm mới danh sách.</p>}
  </section>;
}
