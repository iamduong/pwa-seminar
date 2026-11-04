import { Button } from "#components/ui/button";
import { PlusIcon } from "lucide-react";
import { Link } from "react-router";

const PoiSubmissionPage = () => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Dành cho quản lý</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Cơ sở du lịch
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý các địa điểm đã được phê duyệt và thông tin thực đơn.
          </p>
        </div>
        <Button render={<Link to="/owner/pois/new" />}>
          <PlusIcon /> Đăng ký địa điểm mới
        </Button>
      </header>
    </div>
  );
};

export default PoiSubmissionPage;
