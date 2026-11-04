import { useState } from "react";
import { SearchIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "#components/ui/button";

export type BooleanFilterValue = "all" | "true" | "false";

export interface AdminUserFilterDraft {
  query: string;
  isActive: BooleanFilterValue;
  isPoiOwnerVerified: BooleanFilterValue;
}

interface AdminUserFiltersProps {
  initialValue: AdminUserFilterDraft;
  loading: boolean;
  onSubmit: (draft: AdminUserFilterDraft) => void;
}

export function AdminUserFilters({
  initialValue,
  loading,
  onSubmit,
}: AdminUserFiltersProps) {
  const [query, setQuery] = useState(initialValue.query);
  const [isActive, setIsActive] = useState<BooleanFilterValue>(
    initialValue.isActive,
  );
  const [isPoiOwnerVerified, setIsPoiOwnerVerified] =
    useState<BooleanFilterValue>(initialValue.isPoiOwnerVerified);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      query: query.trim(),
      isActive,
      isPoiOwnerVerified,
    });
  }

  function handleReset() {
    setQuery("");
    setIsActive("all");
    setIsPoiOwnerVerified("all");

    onSubmit({
      query: "",
      isActive: "all",
      isPoiOwnerVerified: "all",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-b p-4"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          <label htmlFor="admin-user-query" className="text-sm font-medium">
            Tìm kiếm người dùng
          </label>

          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <input
              id="admin-user-query"
              type="search"
              maxLength={100}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tên, email hoặc số điện thoại..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="admin-user-active" className="text-sm font-medium">
            Trạng thái tài khoản
          </label>

          <select
            id="admin-user-active"
            value={isActive}
            onChange={(event) =>
              setIsActive(event.target.value as BooleanFilterValue)
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Tất cả</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="admin-user-verified"
            className="text-sm font-medium"
          >
            Xác minh chủ POI
          </label>

          <select
            id="admin-user-verified"
            value={isPoiOwnerVerified}
            onChange={(event) =>
              setIsPoiOwnerVerified(event.target.value as BooleanFilterValue)
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Tất cả</option>
            <option value="true">Đã xác minh</option>
            <option value="false">Chưa xác minh</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={handleReset}
        >
          <RotateCcwIcon aria-hidden="true" />
          Đặt lại
        </Button>

        <Button type="submit" disabled={loading}>
          <SearchIcon aria-hidden="true" />
          Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
