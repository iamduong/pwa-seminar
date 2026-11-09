import { type FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, CheckCircle2Icon, Loader2Icon, SaveIcon, UserRoundPenIcon } from "lucide-react";
import { Link, useParams } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "#components/ui/field";
import { Input } from "#components/ui/input";
import { getApiErrorMessage } from "#lib/api";
import { adminUserService } from "../../../services/AdminUserService";
import type { AdminUser, AdminUserRoleOption } from "../../../types/AdminUser";

const listPath = "/quan-ly/nguoi-dung/danh-sach-nguoi-dung";
const selectClassName = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export default function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>();
  return <AdminUserEditForm key={id} id={id} />;
}

function AdminUserEditForm({ id }: { id: string | undefined }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<AdminUserRoleOption[]>([]);
  const [fullName, setFullName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [errors, setErrors] = useState<{ full_name?: string; role_id?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setLoading(true);
      setLoadError("");
      try {
        if (!id) throw new Error("Thiếu ID người dùng.");
        const [userResponse, rolesResponse] = await Promise.all([
          adminUserService.GetAdminUser(id, controller.signal),
          adminUserService.RoleOptions(controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (!userResponse.success || !userResponse.data) {
          throw new Error(userResponse.message || "Không tìm thấy người dùng.");
        }
        if (!rolesResponse.success || !rolesResponse.data) {
          throw new Error(rolesResponse.message || "Không thể tải danh sách vai trò.");
        }
        const loadedUser = userResponse.data;
        setUser(loadedUser);
        setRoles(rolesResponse.data);
        setFullName(loadedUser.full_name);
        setIsActive(loadedUser.is_active);
        setRoleId(loadedUser.role_id ?? "");
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(getApiErrorMessage(error, error instanceof Error ? error.message : undefined));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadUser();
    return () => controller.abort();
  }, [id, requestVersion]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !user || loading || submitting.current) return;
    setRequestError("");
    setIsSaved(false);
    const nextErrors: typeof errors = {};
    const name = fullName.trim();
    if (name.length < 2 || name.length > 100) {
      nextErrors.full_name = "Họ và tên phải có từ 2 đến 100 ký tự.";
    }
    if (!roles.some((role) => role.id === roleId)) {
      nextErrors.role_id = "Vui lòng chọn một vai trò hợp lệ.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    submitting.current = true;
    setIsSubmitting(true);
    try {
      const response = await adminUserService.UpdateAdminUser(id, {
        full_name: name,
        is_active: isActive,
        role_id: roleId,
      });
      if (!response.success) {
        throw new Error(response.message || "Không thể cập nhật người dùng.");
      }
      setFullName(name);
      setIsSaved(true);
    } catch (error) {
      setRequestError(getApiErrorMessage(error, error instanceof Error ? error.message : undefined));
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit" render={<Link to={listPath} />}>
          <ArrowLeftIcon aria-hidden="true" />
          Quay lại danh sách
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Chỉnh sửa người dùng</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cập nhật họ tên, trạng thái tài khoản và vai trò của người dùng.</p>
        </div>
      </header>

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 rounded-xl border bg-card p-12 text-sm text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
          Đang tải thông tin người dùng...
        </div>
      ) : loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Không thể tải thông tin người dùng</AlertTitle>
          <AlertDescription>
            <p>{loadError}</p>
            <Button type="button" variant="outline" onClick={() => setRequestVersion((version) => version + 1)}>Thử lại</Button>
          </AlertDescription>
        </Alert>
      ) : user && (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <UserRoundPenIcon className="size-5" aria-hidden="true" />
            <h2 className="font-semibold">Thông tin tài khoản</h2>
          </div>
          <form onSubmit={handleSubmit} onChange={() => setIsSaved(false)} noValidate className="space-y-6 p-5">
            <FieldGroup>
              {requestError && (
                <Alert variant="destructive">
                  <AlertTitle>Không thể cập nhật người dùng</AlertTitle>
                  <AlertDescription>{requestError}</AlertDescription>
                </Alert>
              )}
              {isSaved && (
                <Alert role="status">
                  <CheckCircle2Icon aria-hidden="true" />
                  <AlertTitle>Cập nhật người dùng thành công</AlertTitle>
                  <AlertDescription>Thông tin tài khoản đã được lưu vào hệ thống.</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field data-invalid={Boolean(errors.full_name)}>
                  <FieldLabel htmlFor="full_name">Họ và tên</FieldLabel>
                  <Input id="full_name" name="full_name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} disabled={isSubmitting} aria-invalid={Boolean(errors.full_name)} aria-describedby={errors.full_name ? "full-name-error" : undefined} />
                  <FieldError id="full-name-error">{errors.full_name}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
                  <Input id="phone" type="tel" value={user.phone ?? ""} readOnly className="bg-muted/40" aria-describedby="readonly-contact" />
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" value={user.email ?? ""} readOnly className="bg-muted/40" aria-describedby="readonly-contact" />
                  <p id="readonly-contact" className="text-sm text-muted-foreground">Email và số điện thoại chỉ được xem tại đây.</p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="is_active">Trạng thái tài khoản</FieldLabel>
                  <select id="is_active" name="is_active" value={String(isActive)} onChange={(event) => setIsActive(event.target.value === "true")} disabled={isSubmitting} className={selectClassName}>
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã khóa</option>
                  </select>
                </Field>
                <Field data-invalid={Boolean(errors.role_id)}>
                  <FieldLabel htmlFor="role_id">Vai trò</FieldLabel>
                  <select id="role_id" name="role_id" value={roles.some((role) => role.id === roleId) ? roleId : ""} onChange={(event) => setRoleId(event.target.value)} disabled={isSubmitting || roles.length === 0} className={selectClassName} aria-invalid={Boolean(errors.role_id)} aria-describedby="role-error">
                    <option value="" disabled>Chọn vai trò</option>
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                  <FieldError id="role-error">{errors.role_id || (roles.length === 0 ? "Không có vai trò khả dụng. Vui lòng thử lại sau." : null)}</FieldError>
                </Field>
              </div>
              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button type="button" variant="outline" disabled={isSubmitting} render={<Link to={listPath} />}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting || roles.length === 0}>
                  {isSubmitting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <SaveIcon aria-hidden="true" />}
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </section>
      )}
    </div>
  );
}
