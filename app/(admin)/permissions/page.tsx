import { PermissionWorkspace } from "@/app/components/admin/RbacActionForms";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { ADMIN_PERMISSION_KEYS } from "@/lib/auth/roles";
import { getAdminPermissionsPageData } from "@/lib/services/admin.server";
import Link from "next/link";

const PROTECTED_PERMISSION_KEYS = new Set<string>(Object.values(ADMIN_PERMISSION_KEYS));

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPermissionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminPermissionsPageData({
    q: getFirstParam(resolvedSearchParams.q),
    module: getFirstParam(resolvedSearchParams.module),
  });

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Permissions & Binding</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Manage capability keys and bind them to roles without losing the security context.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This workspace separates protected system keys from custom permissions, shows how widely each key is used,
              and keeps bind or unbind operations in the same admin surface.
            </p>
          </div>

        </div>
      </section>

      
      <section className="legal-panel p-4 md:p-6">
        <form className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)_auto_auto]">
          <AdminSearchField
            defaultValue={data.filters.q}
            placeholder="Search permission key or description"
          />

          <AdminSearchField
            name="module"
            defaultValue={data.filters.module}
            placeholder="Search module"
            listId="permission-module-options"
            suggestions={data.modules}
          />

          <button type="submit" className="legal-button-primary w-full xl:w-auto">
            Apply Filters
          </button>

          <Link href="/permissions" className="legal-button-secondary w-full xl:w-auto">
            Reset
          </Link>
        </form>
      </section>

      <PermissionWorkspace
        permissions={data.rows}
        roles={data.roles}
        bindings={data.rolePermissions}
        protectedPermissionKeys={Array.from(PROTECTED_PERMISSION_KEYS)}
      />

    </div>
  );
}
