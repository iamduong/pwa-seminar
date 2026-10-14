import { useState, type FormEvent } from "react";
import { FilterIcon, SearchIcon } from "lucide-react";

import { Button } from "#components/ui/button";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/ui/select";

export type BooleanFilterValue = "all" | "true" | "false";

export interface AdminUserFilterDraft {
  query: string;
  active: BooleanFilterValue;
  verified: BooleanFilterValue;
}

interface AdminUserFiltersProps {
  initialValue: AdminUserFilterDraft;
  loading: boolean;
  onSubmit: (value: AdminUserFilterDraft) => void;
}

export function AdminUserFilters({
  initialValue,
  loading,
  onSubmit,
}: AdminUserFiltersProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <form className="border-b p-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-[minmax(18rem,1fr)_14rem_14rem_auto] xl:items-end">
        <div className="space-y-1.5 md:col-span-3 xl:col-span-1">
          <Label htmlFor="user-search">Tìm kiếm</Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="user-search"
              className="pl-8"
              maxLength={100}
              placeholder="Tên, email hoặc số điện thoại"
              value={value.query}
              onChange={(event) =>
                setValue({ ...value, query: event.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="active-filter">Trạng thái tài khoản</Label>
          <div>
            <Select
              value={value.active}
              onValueChange={(active) =>
                active &&
                setValue({ ...value, active: active as BooleanFilterValue })
              }
            >
              <SelectTrigger id="active-filter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="verified-filter">Xác minh chủ địa điểm</Label>
          <div>
            <Select
            value={value.verified}
            onValueChange={(verified) =>
              verified &&
              setValue({ ...value, verified: verified as BooleanFilterValue })
            }
          >
            <SelectTrigger id="verified-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả xác minh</SelectItem>
              <SelectItem value="true">Đã xác minh</SelectItem>
              <SelectItem value="false">Chưa xác minh</SelectItem>
            </SelectContent>
          </Select>
          </div>
        </div>

        <Button type="submit" className="md:w-fit xl:w-auto" disabled={loading}>
          <FilterIcon aria-hidden="true" />
          Lọc
        </Button>
      </div>
    </form>
  );
}
