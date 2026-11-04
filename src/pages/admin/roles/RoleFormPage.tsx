import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  Loader2Icon,
  SaveIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";

import { Alert, AlertDescription, AlertTitle } from "#components/ui/alert";
import { Button } from "#components/ui/button";
import { Checkbox } from "#components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#components/ui/field";
import { Input } from "#components/ui/input";
import { getApiErrorMessage } from "#lib/api";
import { roleService } from "../../../services/RoleService";
import { getPermissionGroups } from "./permission-options";

interface RoleFormPageProps {
  mode: "create" | "edit";
}

const ROLE_LIST_PATH = "/quan-ly/quyen-han/danh-sach-vai-tro";

type FormErrors = {
  name?: string;
  priority?: string;
};

export default function RoleFormPage({ mode }: RoleFormPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [name, setName] = useState("");
  const [priority, setPriority] = useState("10");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const controller = new AbortController();

    async function loadFormData() {
      setLoading(true);
      setRequestError(null);
      try {
        const [permissionResponse, roleResponse] = await Promise.all([
          roleService.getPermissions(controller.signal),
          isEdit && id
            ? roleService.getRole(id, controller.signal)
            : Promise.resolve(null),
        ]);

        if (!permissionResponse.success || !permissionResponse.data) {
          throw new Error("Invalid permission response");
        }

        setAvailablePermissions(permissionResponse.data);

        if (!isEdit) return;

        if (!roleResponse?.success || !roleResponse.data) {
          throw new Error("Invalid role response");
        }

        setName(roleResponse.data.name);
        setPriority(String(roleResponse.data.priority));
        setPermissions(roleResponse.data.permissions);
        setIsSystemRole(roleResponse.data.is_system);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setRequestError(
            getApiErrorMessage(error, "Không thể tải dữ liệu vai trò và quyền hạn."),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadFormData();
    return () => controller.abort();
  }, [id, isEdit]);

  const permissionGroups = useMemo(
    () => getPermissionGroups(availablePermissions),
    [availablePermissions],
  );

  const allPermissionValues = useMemo(
    () =>
      permissionGroups.flatMap((group) =>
        group.permissions.map((item) => item.value),
      ),
    [permissionGroups],
  );

  function togglePermission(permission: string, checked: boolean) {
    setPermissions((current) =>
      checked
        ? [...new Set([...current, permission])]
        : current.filter((item) => item !== permission),
    );
  }

  function toggleGroup(values: string[], checked: boolean) {
    setPermissions((current) =>
      checked
        ? [...new Set([...current, ...values])]
        : current.filter((item) => !values.includes(item)),
    );
  }

  function validate() {
    const nextErrors: FormErrors = {};
    const normalizedName = name.trim();
    const parsedPriority = Number(priority);

    if (!normalizedName) {
      nextErrors.name = "Vui lòng nhập tên vai trò.";
    } else if (!/^[a-z][a-z0-9_]*$/.test(normalizedName)) {
      nextErrors.name = "Tên chỉ gồm chữ thường, số, dấu gạch dưới và phải bắt đầu bằng chữ.";
    }

    if (
      !isSystemRole &&
      (!Number.isInteger(parsedPriority) ||
        parsedPriority < 0 ||
        parsedPriority > 1000)
    ) {
      nextErrors.priority = "Độ ưu tiên phải là số nguyên từ 0 đến 1000.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      priority: Number(priority),
      permissions,
    };

    try {
      if (isEdit && id) {
        await roleService.updateRole(
          id,
          isSystemRole ? { name: payload.name } : payload,
        );
      } else {
        await roleService.createRole(payload);
      }
      navigate(ROLE_LIST_PATH, { replace: true });
    } catch (error: unknown) {
      setRequestError(
        getApiErrorMessage(
          error,
          isEdit ? "Không thể cập nhật vai trò." : "Không thể tạo vai trò.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        Đang tải thông tin vai trò...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <Button
          variant="ghost"
          className="-ml-2 mb-3"
          render={<Link to={ROLE_LIST_PATH} />}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Danh sách vai trò
        </Button>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-card">
            <ShieldCheckIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? "Chỉnh sửa vai trò" : "Thêm vai trò"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? "Cập nhật thông tin và phạm vi truy cập của vai trò."
                : "Tạo vai trò mới và lựa chọn các quyền phù hợp."}
            </p>
          </div>
        </div>
      </header>

      {requestError && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Không thể lưu vai trò</AlertTitle>
          <AlertDescription>{requestError}</AlertDescription>
        </Alert>
      )}

      {isSystemRole && (
        <Alert>
          <ShieldCheckIcon aria-hidden="true" />
          <AlertTitle>Vai trò hệ thống</AlertTitle>
          <AlertDescription>
            Bạn chỉ có thể thay đổi tên. Độ ưu tiên và quyền hạn được hệ thống bảo vệ.
          </AlertDescription>
        </Alert>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold">Thông tin chung</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tên vai trò được dùng để nhận diện trong hệ thống.
            </p>
          </div>
          <FieldGroup className="grid gap-5 md:grid-cols-[minmax(0,1fr)_12rem]">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="role-name">Tên vai trò</FieldLabel>
              <Input
                id="role-name"
                value={name}
                maxLength={50}
                placeholder="Ví dụ: content_manager"
                aria-invalid={Boolean(errors.name)}
                disabled={submitting}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldDescription>Dùng chữ thường, số và dấu gạch dưới.</FieldDescription>
              <FieldError>{errors.name}</FieldError>
            </Field>
            <Field data-invalid={Boolean(errors.priority)}>
              <FieldLabel htmlFor="role-priority">Độ ưu tiên</FieldLabel>
              <Input
                id="role-priority"
                type="number"
                min={0}
                max={1000}
                value={priority}
                aria-invalid={Boolean(errors.priority)}
                disabled={submitting || isSystemRole}
                onChange={(event) => setPriority(event.target.value)}
              />
              <FieldDescription>Số nhỏ được ưu tiên cao hơn.</FieldDescription>
              <FieldError>{errors.priority}</FieldError>
            </Field>
          </FieldGroup>
        </section>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Phạm vi quyền hạn</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Đã chọn {permissions.length}/{allPermissionValues.length} quyền.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting || isSystemRole}
              onClick={() =>
                setPermissions(
                  permissions.length === allPermissionValues.length ? [] : allPermissionValues,
                )
              }
            >
              {permissions.length === allPermissionValues.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
          </div>

          <div className="divide-y">
            {permissionGroups.map((group) => {
              const values = group.permissions.map((item) => item.value);
              const selectedCount = values.filter((value) => permissions.includes(value)).length;
              const allSelected = selectedCount === values.length;
              const partiallySelected = selectedCount > 0 && !allSelected;

              return (
                <section key={group.title} className="p-5" aria-label={group.title}>
                  <div className="mb-4 flex items-start gap-3">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={partiallySelected}
                      disabled={submitting || isSystemRole}
                      aria-label={`Chọn toàn bộ quyền ${group.title}`}
                      onCheckedChange={(checked) => toggleGroup(values, checked)}
                    />
                    <div>
                      <h3 className="text-sm font-semibold">{group.title}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {group.permissions.map((permission) => {
                      const checkboxId = `permission-${permission.value.replace(":", "-")}`;
                      return (
                        <label
                          key={permission.value}
                          htmlFor={checkboxId}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 has-data-checked:border-primary/30 has-data-checked:bg-primary/5"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={permissions.includes(permission.value)}
                            disabled={submitting || isSystemRole}
                            onCheckedChange={(checked) => togglePermission(permission.value, checked)}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{permission.label}</span>
                            <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                              {permission.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" render={<Link to={ROLE_LIST_PATH} />}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={
              submitting ||
              (!isSystemRole && availablePermissions.length === 0)
            }
          >
            {submitting ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <SaveIcon aria-hidden="true" />
            )}
            {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo vai trò"}
          </Button>
        </div>
      </form>
    </div>
  );
}
