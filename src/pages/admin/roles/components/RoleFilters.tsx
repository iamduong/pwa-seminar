import { useState, type FormEvent } from "react";
import { SearchIcon } from "lucide-react";

import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";

export type RoleStatusFilter = "active" | "deleted";

interface RoleFiltersProps {
  initialQuery: string;
  initialStatus: RoleStatusFilter;
  loading: boolean;
  onSubmit: (query: string, status: RoleStatusFilter) => void;
}

export function RoleFilters({
  initialQuery,
  initialStatus,
  loading,
  onSubmit,
}: RoleFiltersProps) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<RoleStatusFilter>(initialStatus);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(query.trim(), status);
  }

  function changeStatus(nextStatus: RoleStatusFilter) {
    setStatus(nextStatus);
    onSubmit(query.trim(), nextStatus);
  }

  return (
    <form className="border-b p-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-[minmax(16rem,1fr)_14rem_auto] sm:items-end">
        <div className="w-full max-w-md space-y-1.5">
          <Label htmlFor="role-search">Tìm kiếm vai trò</Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="role-search"
              className="pl-8"
              value={query}
              maxLength={100}
              placeholder="Nhập tên vai trò"
              disabled={loading}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label id="role-status-label">Trạng thái</Label>
          <div
            className="grid h-8 grid-cols-2 rounded-lg border bg-muted/30 p-0.5"
            role="group"
            aria-labelledby="role-status-label"
          >
            <Button
              type="button"
              size="sm"
              variant={status === "active" ? "default" : "ghost"}
              className={status === "active" ? "h-6 shadow-sm" : "h-6"}
              aria-pressed={status === "active"}
              disabled={loading}
              onClick={() => changeStatus("active")}
            >
              Hoạt động
            </Button>
            <Button
              type="button"
              size="sm"
              variant={status === "deleted" ? "default" : "ghost"}
              className={status === "deleted" ? "h-6 shadow-sm" : "h-6"}
              aria-pressed={status === "deleted"}
              disabled={loading}
              onClick={() => changeStatus("deleted")}
            >
              Đã xóa
            </Button>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          <SearchIcon aria-hidden="true" />
          Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
