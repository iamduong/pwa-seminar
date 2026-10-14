import { Button } from "#components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const PAGE_SIZE_OPTIONS = [20, 30, 50] as const

interface DataPaginationProps {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  disabled?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  return [...pages].filter((item) => item > 0 && item <= totalPages).sort((a, b) => a - b)
}

export function DataPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: DataPaginationProps) {
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {totalItems.toLocaleString("vi-VN")} người dùng
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="pagination-page-size">
            Số dòng
          </label>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => value && onPageSizeChange(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger id="pagination-page-size" className="w-18" aria-label="Số dòng mỗi trang">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex items-center gap-1" aria-label="Phân trang">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Trang trước"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon aria-hidden="true" />
          </Button>

          {visiblePages.map((pageNumber, index) => {
            const previousPage = visiblePages[index - 1]
            const hasGap = previousPage !== undefined && pageNumber - previousPage > 1

            return (
              <span className="contents" key={pageNumber}>
                {hasGap && <span className="px-1 text-muted-foreground">…</span>}
                <Button
                  type="button"
                  variant={pageNumber === page ? "default" : "ghost"}
                  size="icon"
                  aria-label={`Trang ${pageNumber}`}
                  aria-current={pageNumber === page ? "page" : undefined}
                  disabled={disabled}
                  onClick={() => onPageChange(pageNumber)}
                >
                  {pageNumber}
                </Button>
              </span>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Trang sau"
            disabled={disabled || page >= totalPages || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  )
}
