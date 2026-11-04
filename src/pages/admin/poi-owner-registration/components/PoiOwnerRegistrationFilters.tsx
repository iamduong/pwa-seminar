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
import type { PoiOwnerRegistrationStatus } from "../../../../types/PoiOwnerRegistration";

export type StatusFilterValue = PoiOwnerRegistrationStatus | "all";

export interface PoiOwnerRegistrationFilterDraft {
  query: string;
  status: StatusFilterValue;
}

interface PoiOwnerRegistrationFiltersProps {
  initialValue: PoiOwnerRegistrationFilterDraft;
  loading: boolean;
  onSubmit: (value: PoiOwnerRegistrationFilterDraft) => void;
}

export function PoiOwnerRegistrationFilters({
  initialValue,
  loading,
  onSubmit,
}: PoiOwnerRegistrationFiltersProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ ...value, query: value.query.trim() });
  }

  return (
    <form className="border-b p-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-[minmax(16rem,1fr)_14rem_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="registration-search">Tìm kiếm</Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="registration-search"
              className="pl-8"
              maxLength={100}
              placeholder="Tên doanh nghiệp hoặc địa chỉ"
              value={value.query}
              disabled={loading}
              onChange={(event) =>
                setValue({ ...value, query: event.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="registration-status">Trạng thái</Label>
          <Select
            value={value.status}
            onValueChange={(status) =>
              status &&
              setValue({ ...value, status: status as StatusFilterValue })
            }
          >
            <SelectTrigger
              id="registration-status"
              className="w-full"
              disabled={loading}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Đã từ chối</SelectItem>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="sm:w-fit" disabled={loading}>
          <FilterIcon aria-hidden="true" />
          Lọc đơn
        </Button>
      </div>
    </form>
  );
}
