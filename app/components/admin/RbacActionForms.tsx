"use client";

import { Fragment, useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminPagination from "@/app/components/admin/AdminPagination";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  permissions: string[];
  assignedUsers: Array<{
    id: string;
    displayName: string;
    primaryEmail: string | null;
  }>;
}

interface PermissionRow {
  id: string;
  key: string;
  description: string | null;
  module: string;
  isActive: boolean;
  roleIds: string[];
  roleCount: number;
}

interface RolePermissionBinding {
  id: string;
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionKey: string;
  isActive: boolean;
  grantedAt: Date | string;
}

interface RoleInfo {
  id: string;
  name: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  assignedUsers: Array<{
    id: string;
    displayName: string;
    primaryEmail: string | null;
  }>;
}

interface SearchableOption {
  value: string;
  label: string;
}

const PURPLE = "#4C2F5E";
const TABLE_PAGE_SIZE = 5;

const CASE_QUICK_PERMISSIONS = [
  { key: "case.create", description: "Allows creating new cases" },
  { key: "case.view", description: "Allows viewing case records" },
  { key: "case.update", description: "Allows editing existing cases" },
  { key: "case.delete", description: "Allows deleting case records" },
];

const inputCls =
  "w-full rounded-lg border border-[#4C2F5E]/20 bg-white px-3.5 py-2.5 text-sm text-[#102033] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C2F5E]/30 transition-shadow";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#8C7A9B]">
      {children}
    </label>
  );
}

function SearchableSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: SearchableOption[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const selectedOption = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selectedOption?.label ?? "");

  function findOption(input: string) {
    const normalized = input.trim().toLowerCase();
    if (!normalized) return undefined;

    return options.find((option) => option.label.toLowerCase() === normalized);
  }

  function handleChange(nextQuery: string) {
    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      onChange("");
      return;
    }

    const match = findOption(nextQuery);
    if (match) {
      onChange(match.value);
    }
  }

  function handleBlur() {
    const match = findOption(query);

    if (match) {
      setQuery(match.label);
      onChange(match.value);
      return;
    }

    setQuery(selectedOption?.label ?? "");
    if (!selectedOption) {
      onChange("");
    }
  }

  return (
    <>
      <input
        className={inputCls}
        list={listId}
        value={query}
        placeholder={placeholder}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </>
  );
}

function Toast({
  ok,
  err,
  onClose,
}: {
  ok: string;
  err: string;
  onClose: () => void;
}) {
  if (!ok && !err) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${
        err
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span>{err || ok}</span>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-lg leading-none opacity-60 transition-opacity hover:opacity-100"
      >
        x
      </button>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white"
      style={{ backgroundColor: PURPLE }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className={`border-b border-[#4C2F5E]/8 px-4 py-3.5 text-sm align-middle ${
        mono ? "font-mono text-xs text-[#8C7A9B]" : "text-[#2F1D3B]"
      }`}
    >
      {children}
    </td>
  );
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-10 text-center text-sm text-slate-400">
        {text}
      </td>
    </tr>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  return Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentPage - 3),
    currentPage + 2,
  );
}

function TablePagination({
  total,
  currentPage,
  onPageChange,
}: {
  total: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * TABLE_PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(safePage * TABLE_PAGE_SIZE, total);
  const visiblePages = getVisiblePages(safePage, totalPages);

  return (
    <section className="flex flex-col gap-4 border-t border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Results</p>
        <p className="mt-1 text-sm text-slate-600">
          Showing {start} to {end} of {new Intl.NumberFormat("en-US").format(total)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="inline-flex h-11 items-center rounded-full border border-[#4C2F5E]/12 bg-white px-4 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#FBF9FD] disabled:pointer-events-none disabled:opacity-40"
        >
          Prev
        </button>

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition ${
              pageNumber === safePage
                ? "bg-[#4C2F5E] text-white shadow-sm"
                : "border border-[#4C2F5E]/12 bg-white text-[#4C2F5E] hover:bg-[#FBF9FD]"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="inline-flex h-11 items-center rounded-full border border-[#4C2F5E]/12 bg-white px-4 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#FBF9FD] disabled:pointer-events-none disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}

function PrimaryBtn({
  children,
  disabled,
  type = "submit",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: PURPLE }}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: PURPLE }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:pointer-events-none disabled:opacity-50 ${
        tone === "danger"
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : "border-[#4C2F5E]/15 bg-white text-[#4C2F5E] hover:bg-[#FBF9FD]"
      }`}
    >
      {children}
    </button>
  );
}

function FormPanel({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null;

  return <div className="space-y-4 rounded-xl border border-[#4C2F5E]/15 bg-[#FBF9FD] p-5">{children}</div>;
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function RoleCatalogManager({
  roles: initial,
  pagination,
}: {
  roles: RoleRow[];
  pagination?: React.ComponentProps<typeof AdminPagination>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const field =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  function resetMsg() {
    setOk("");
    setErr("");
  }

  function beginEdit(role: RoleRow) {
    resetMsg();
    setEditingRoleId(role.id);
    setEditForm({
      name: role.name,
      description: role.description ?? "",
    });
  }

  async function updateRole() {
    if (!editingRoleId) return;
    resetMsg();
    setActiveActionId(editingRoleId);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRoleId,
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk("Role updated successfully.");
      setEditingRoleId(null);
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActiveActionId(null);
    }
  }

  async function toggleRole(role: RoleRow) {
    resetMsg();
    setActiveActionId(role.id);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: role.id,
          isActive: !role.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk(`Role marked ${role.isActive ? "inactive" : "active"} successfully.`);
      if (editingRoleId === role.id) {
        setEditingRoleId(null);
      }
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    resetMsg();

    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk("Role created successfully.");
      setForm({ name: "", description: "" });
      setShowForm(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  return (
    <section className="legal-panel space-y-6 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#102033]">Role</h2>
          <p className="mt-0.5 text-sm text-slate-500">Manage system and custom roles.</p>
        </div>
        <GhostBtn
          onClick={() => {
            setShowForm((current) => !current);
            resetMsg();
          }}
        >
          {showForm ? <><XIcon /> Close Form</> : <><PlusIcon /> Add Role</>}
        </GhostBtn>
      </div>

      {(ok || err) && <Toast ok={ok} err={err} onClose={resetMsg} />}

      <FormPanel visible={showForm}>
        <p className="text-sm font-semibold text-[#102033]">New Role</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>name</FieldLabel>
              <input className={inputCls} placeholder="e.g. Moderator" value={form.name} onChange={field("name")} required />
            </div>
            <div>
              <FieldLabel>description</FieldLabel>
              <input className={inputCls} placeholder="Optional description" value={form.description} onChange={field("description")} />
            </div>
          </div>
          <div className="flex gap-3">
            <PrimaryBtn disabled={isPending}>Submit</PrimaryBtn>
            <GhostBtn
              onClick={() => {
                setShowForm(false);
                resetMsg();
                setForm({ name: "", description: "" });
              }}
            >
              Cancel
            </GhostBtn>
          </div>
        </form>
      </FormPanel>

      <div className="overflow-x-auto rounded-xl border border-[#4C2F5E]/15 shadow-sm">
        <table className="w-full">
          <thead>
            <tr>
              <Th>name</Th>
              <Th>description</Th>
              <Th>status</Th>
              <Th>options</Th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {initial.length === 0 ? (
              <EmptyRow cols={4} text='No roles yet. Click "Add Role" to create one.' />
            ) : (
              initial.map((role) => (
                <Fragment key={role.id}>
                  <tr className="transition-colors hover:bg-[#FBF9FD]">
                    <Td><span className="font-medium capitalize text-[#102033]">{role.name}</span></Td>
                    <Td><span className="text-slate-500">{role.description ?? "-"}</span></Td>
                    <Td><StatusBadge isActive={role.isActive} /></Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <ActionBtn onClick={() => beginEdit(role)} disabled={activeActionId === role.id}>
                          Update
                        </ActionBtn>
                        <ActionBtn
                          onClick={() => toggleRole(role)}
                          disabled={activeActionId === role.id}
                          tone={role.isActive ? "danger" : "default"}
                        >
                          {role.isActive ? "Inactive" : "Active"}
                        </ActionBtn>
                      </div>
                    </Td>
                  </tr>
                  {editingRoleId === role.id ? (
                    <tr className="bg-[#FBF9FD]">
                      <td colSpan={4} className="border-b border-[#4C2F5E]/8 px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                          <div>
                            <FieldLabel>name</FieldLabel>
                            <input
                              className={inputCls}
                              value={editForm.name}
                              onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                            />
                          </div>
                          <div>
                            <FieldLabel>description</FieldLabel>
                            <input
                              className={inputCls}
                              value={editForm.description}
                              onChange={(event) =>
                                setEditForm((current) => ({ ...current, description: event.target.value }))
                              }
                            />
                          </div>
                          <div className="flex gap-2">
                            <PrimaryBtn type="button" disabled={activeActionId === role.id} onClick={updateRole}>
                              Save
                            </PrimaryBtn>
                            <ActionBtn
                              onClick={() => setEditingRoleId(null)}
                              disabled={activeActionId === role.id}
                            >
                              Cancel
                            </ActionBtn>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
        {pagination ? <AdminPagination {...pagination} /> : null}
      </div>
    </section>
  );
}

export function PermissionWorkspace({
  permissions: initialPermissions,
  roles,
  bindings: initialBindings,
}: {
  permissions: PermissionRow[];
  roles: RoleInfo[];
  bindings: RolePermissionBinding[];
  protectedPermissionKeys: string[];
}) {
  return (
    <div className="space-y-6">
      <PermissionsSection permissions={initialPermissions} />
      <RolePermissionsSection bindings={initialBindings} roles={roles} permissions={initialPermissions} />
    </div>
  );
}

function PermissionsSection({ permissions: initial }: { permissions: PermissionRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [permissions] = useState<PermissionRow[]>(initial);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", description: "", preset: "" });
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ key: "", description: "" });
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const field =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  function resetMsg() {
    setOk("");
    setErr("");
  }

  function beginEdit(permission: PermissionRow) {
    resetMsg();
    setEditingPermissionId(permission.id);
    setEditForm({
      key: permission.key,
      description: permission.description ?? "",
    });
  }

  async function updatePermission() {
    if (!editingPermissionId) return;
    resetMsg();
    setActiveActionId(editingPermissionId);

    try {
      const response = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPermissionId,
          key: editForm.key.trim(),
          description: editForm.description.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk("Permission updated successfully.");
      setEditingPermissionId(null);
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActiveActionId(null);
    }
  }

  async function togglePermission(permission: PermissionRow) {
    resetMsg();
    setActiveActionId(permission.id);

    try {
      const response = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: permission.id,
          isActive: !permission.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk(`Permission marked ${permission.isActive ? "inactive" : "active"} successfully.`);
      if (editingPermissionId === permission.id) {
        setEditingPermissionId(null);
      }
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActiveActionId(null);
    }
  }

  async function submit(payload: { id: string; key: string; description: string | null }) {
    resetMsg();

    try {
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk(`"${payload.key}" created successfully.`);
      setForm({ key: "", description: "", preset: "" });
      setShowForm(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await submit({
      id: form.key.trim().replace(".", "_"),
      key: form.key.trim(),
      description: form.description.trim() || null,
    });
  }

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(permissions.length / TABLE_PAGE_SIZE));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, permissions.length]);

  const existingKeys = new Set(permissions.map((permission) => permission.key));
  const presetOptions = CASE_QUICK_PERMISSIONS.filter((preset) => !existingKeys.has(preset.key)).map((preset) => ({
    value: preset.key,
    label: preset.key,
  }));
  const paginatedPermissions = permissions.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <section className="legal-panel space-y-6 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#102033]">Permission</h2>
          <p className="mt-0.5 text-sm text-slate-500">Create and manage permission keys.</p>
        </div>
        <GhostBtn
          onClick={() => {
            setShowForm((current) => !current);
            resetMsg();
          }}
        >
          {showForm ? <><XIcon /> Close Form</> : <><PlusIcon /> Add Permission</>}
        </GhostBtn>
      </div>

      {(ok || err) && <Toast ok={ok} err={err} onClose={resetMsg} />}

      <FormPanel visible={showForm}>
        <p className="text-sm font-semibold text-[#102033]">New Permission</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>key</FieldLabel>
              <input className={inputCls} placeholder="e.g. case.create" value={form.key} onChange={field("key")} required />
            </div>
            <div>
              <FieldLabel>description</FieldLabel>
              <input className={inputCls} placeholder="Optional description" value={form.description} onChange={field("description")} />
            </div>
          </div>

          <div>
            <FieldLabel>or pick a case permission preset</FieldLabel>
            <SearchableSelect
              key={`permission-preset-${form.preset || "empty"}`}
              value={form.preset}
              options={presetOptions}
              placeholder="Search a case permission preset"
              onChange={(selectedKey) => {
                const preset = CASE_QUICK_PERMISSIONS.find((item) => item.key === selectedKey);
                if (!preset) {
                  setForm((current) => ({ ...current, preset: "" }));
                  return;
                }

                setForm((current) => ({
                  ...current,
                  preset: preset.key,
                  key: preset.key,
                  description: preset.description,
                }));
              }}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Selecting a preset auto-fills the fields above. Already-added presets are hidden.
            </p>
            {presetOptions.length === 0 ? (
              <p className="mt-1.5 text-[11px] text-slate-400">All case permission presets have already been added.</p>
            ) : null}
          </div>

          <div className="flex gap-3">
            <PrimaryBtn disabled={isPending}>Submit</PrimaryBtn>
            <GhostBtn
              onClick={() => {
                setShowForm(false);
                resetMsg();
                setForm({ key: "", description: "", preset: "" });
              }}
            >
              Cancel
            </GhostBtn>
          </div>
        </form>
      </FormPanel>

      <div className="overflow-x-auto rounded-xl border border-[#4C2F5E]/15 shadow-sm">
        <table className="w-full">
          <thead>
            <tr>
              <Th>key</Th>
              <Th>description</Th>
              <Th>status</Th>
              <Th>options</Th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {permissions.length === 0 ? (
              <EmptyRow cols={4} text='No permissions yet. Click "Add Permission" or use quick-add above.' />
            ) : (
              paginatedPermissions.map((permission) => (
                <Fragment key={permission.id}>
                  <tr className="transition-colors hover:bg-[#FBF9FD]">
                    <Td>
                      <span className="font-mono text-xs font-semibold text-[#4C2F5E]">{permission.key}</span>
                    </Td>
                    <Td><span className="text-slate-500">{permission.description ?? "-"}</span></Td>
                    <Td><StatusBadge isActive={permission.isActive} /></Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <ActionBtn onClick={() => beginEdit(permission)} disabled={activeActionId === permission.id}>
                          Update
                        </ActionBtn>
                        <ActionBtn
                          onClick={() => togglePermission(permission)}
                          disabled={activeActionId === permission.id}
                          tone={permission.isActive ? "danger" : "default"}
                        >
                          {permission.isActive ? "Inactive" : "Active"}
                        </ActionBtn>
                      </div>
                    </Td>
                  </tr>
                  {editingPermissionId === permission.id ? (
                    <tr className="bg-[#FBF9FD]">
                      <td colSpan={4} className="border-b border-[#4C2F5E]/8 px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                          <div>
                            <FieldLabel>key</FieldLabel>
                            <input
                              className={inputCls}
                              value={editForm.key}
                              onChange={(event) => setEditForm((current) => ({ ...current, key: event.target.value }))}
                            />
                          </div>
                          <div>
                            <FieldLabel>description</FieldLabel>
                            <input
                              className={inputCls}
                              value={editForm.description}
                              onChange={(event) =>
                                setEditForm((current) => ({ ...current, description: event.target.value }))
                              }
                            />
                          </div>
                          <div className="flex gap-2">
                            <PrimaryBtn
                              type="button"
                              disabled={activeActionId === permission.id}
                              onClick={updatePermission}
                            >
                              Save
                            </PrimaryBtn>
                            <ActionBtn
                              onClick={() => setEditingPermissionId(null)}
                              disabled={activeActionId === permission.id}
                            >
                              Cancel
                            </ActionBtn>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
        <TablePagination total={permissions.length} currentPage={page} onPageChange={setPage} />
      </div>
    </section>
  );
}

function RolePermissionsSection({
  bindings: initial,
  roles,
  permissions,
}: {
  bindings: RolePermissionBinding[];
  roles: RoleInfo[];
  permissions: PermissionRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bindings] = useState<RolePermissionBinding[]>(initial);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ roleId: "", permissionId: "" });
  const [editingBindingId, setEditingBindingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ roleId: "", permissionId: "" });
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(bindings.length / TABLE_PAGE_SIZE));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [bindings.length, page]);

  function resetMsg() {
    setOk("");
    setErr("");
  }

  function beginEdit(binding: RolePermissionBinding) {
    resetMsg();
    setEditingBindingId(binding.id);
    setEditForm({
      roleId: binding.roleId,
      permissionId: binding.permissionId,
    });
  }

  async function updateBinding() {
    if (!editingBindingId) return;
    resetMsg();
    setActiveActionId(editingBindingId);

    try {
      const response = await fetch("/api/admin/role-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBindingId,
          roleId: editForm.roleId,
          permissionId: editForm.permissionId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk("Role permission updated successfully.");
      setEditingBindingId(null);
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActiveActionId(null);
    }
  }

  async function toggleBinding(binding: RolePermissionBinding) {
    resetMsg();
    setActiveActionId(binding.id);

    try {
      const response = await fetch("/api/admin/role-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: binding.id,
          isActive: !binding.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk(`Role permission marked ${binding.isActive ? "inactive" : "active"} successfully.`);
      if (editingBindingId === binding.id) {
        setEditingBindingId(null);
      }
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActiveActionId(null);
    }
  }

  async function deleteBinding(binding: RolePermissionBinding) {
    resetMsg();
    setActiveActionId(binding.id);

    try {
      const response = await fetch(`/api/admin/role-permissions?id=${encodeURIComponent(binding.id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk("Role permission deleted successfully.");
      if (editingBindingId === binding.id) {
        setEditingBindingId(null);
      }
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setActiveActionId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    resetMsg();

    if (!form.roleId || !form.permissionId) {
      setErr("Please select both a role and a permission.");
      return;
    }

    try {
      const response = await fetch("/api/admin/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: form.roleId,
          permissionId: form.permissionId,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text().catch(() => "Request failed"));
      }

      setOk("Role permission created successfully.");
      setForm({ roleId: "", permissionId: "" });
      setShowForm(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  const roleOptions = roles.filter((role) => role.isActive).map((role) => ({
    value: role.id,
    label: role.name,
  }));
  const permissionOptions = permissions.filter((permission) => permission.isActive).map((permission) => ({
    value: permission.id,
    label: permission.key,
  }));
  const paginatedBindings = bindings.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  return (
    <section className="legal-panel space-y-6 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#102033]">Role Permission</h2>
          <p className="mt-0.5 text-sm text-slate-500">Bind permissions to roles.</p>
        </div>
        <GhostBtn
          onClick={() => {
            setShowForm((current) => !current);
            resetMsg();
          }}
        >
          {showForm ? <><XIcon /> Close Form</> : <><PlusIcon /> Add Role Permission</>}
        </GhostBtn>
      </div>

      {(ok || err) && <Toast ok={ok} err={err} onClose={resetMsg} />}

      <FormPanel visible={showForm}>
        <p className="text-sm font-semibold text-[#102033]">New Role Permission</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Role</FieldLabel>
              <SearchableSelect
                key={`role-select-${form.roleId || "empty"}`}
                value={form.roleId}
                options={roleOptions}
                placeholder="Search a role"
                onChange={(roleId) => setForm((current) => ({ ...current, roleId }))}
              />
            </div>

            <div>
              <FieldLabel>Permission</FieldLabel>
              <SearchableSelect
                key={`permission-select-${form.permissionId || "empty"}`}
                value={form.permissionId}
                options={permissionOptions}
                placeholder="Search a permission"
                onChange={(permissionId) => setForm((current) => ({ ...current, permissionId }))}
              />
            </div>
          </div>

          {roleOptions.length === 0 || permissionOptions.length === 0 ? (
            <p className="text-[11px] text-slate-400">
              Only active roles and active permissions can be bound together.
            </p>
          ) : null}

          <div className="flex gap-3">
            <PrimaryBtn disabled={isPending || roleOptions.length === 0 || permissionOptions.length === 0}>Submit</PrimaryBtn>
            <GhostBtn
              onClick={() => {
                setShowForm(false);
                resetMsg();
                setForm({ roleId: "", permissionId: "" });
              }}
            >
              Cancel
            </GhostBtn>
          </div>
        </form>
      </FormPanel>

      <div className="overflow-x-auto rounded-xl border border-[#4C2F5E]/15 shadow-sm">
        <table className="w-full">
          <thead>
            <tr>
              <Th>Role</Th>
              <Th>Permission</Th>
              <Th>Status</Th>
              <Th>Options</Th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {bindings.length === 0 ? (
              <EmptyRow cols={4} text='No role permissions yet. Click "Add Role Permission" to create one.' />
            ) : (
              paginatedBindings.map((binding) => (
                <Fragment key={binding.id}>
                  <tr className="transition-colors hover:bg-[#FBF9FD]">
                    <Td><span className="font-medium capitalize text-[#102033]">{binding.roleName}</span></Td>
                    <Td><span className="font-mono text-xs font-semibold text-[#4C2F5E]">{binding.permissionKey}</span></Td>
                    <Td><StatusBadge isActive={binding.isActive} /></Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <ActionBtn onClick={() => beginEdit(binding)} disabled={activeActionId === binding.id}>
                          Update
                        </ActionBtn>
                        <ActionBtn
                          onClick={() => toggleBinding(binding)}
                          disabled={activeActionId === binding.id}
                          tone={binding.isActive ? "danger" : "default"}
                        >
                          {binding.isActive ? "Inactive" : "Active"}
                        </ActionBtn>
                        <ActionBtn onClick={() => deleteBinding(binding)} disabled={activeActionId === binding.id} tone="danger">
                          Delete
                        </ActionBtn>
                      </div>
                    </Td>
                  </tr>
                  {editingBindingId === binding.id ? (
                    <tr className="bg-[#FBF9FD]">
                      <td colSpan={4} className="border-b border-[#4C2F5E]/8 px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                          <div>
                            <FieldLabel>Role</FieldLabel>
                            <SearchableSelect
                              key={`binding-role-${binding.id}-${editForm.roleId || "empty"}`}
                              value={editForm.roleId}
                              options={roleOptions}
                              placeholder="Search a role"
                              onChange={(roleId) => setEditForm((current) => ({ ...current, roleId }))}
                            />
                          </div>
                          <div>
                            <FieldLabel>Permission</FieldLabel>
                            <SearchableSelect
                              key={`binding-permission-${binding.id}-${editForm.permissionId || "empty"}`}
                              value={editForm.permissionId}
                              options={permissionOptions}
                              placeholder="Search a permission"
                              onChange={(permissionId) => setEditForm((current) => ({ ...current, permissionId }))}
                            />
                          </div>
                          <div className="flex gap-2">
                            <PrimaryBtn type="button" disabled={activeActionId === binding.id} onClick={updateBinding}>
                              Save
                            </PrimaryBtn>
                            <ActionBtn onClick={() => setEditingBindingId(null)} disabled={activeActionId === binding.id}>
                              Cancel
                            </ActionBtn>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
        <TablePagination total={bindings.length} currentPage={page} onPageChange={setPage} />
      </div>
    </section>
  );
}
