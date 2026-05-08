import { RoleCatalogManager } from "@/app/components/admin/RbacActionForms";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminRolesPageData } from "@/lib/services/admin.server";
import Link from "next/link";

function buildQueryString(
  filters: {
    q: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) {
    params.set("q", next.q);
  }

  if (next.page > 1) {
    params.set("page", `${next.page}`);
  }

  const query = params.toString();
  return query ? `/roles?${query}` : "/roles";
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminRolesPageData({
    q: getFirstParam(resolvedSearchParams.q),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const visiblePages = Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, data.filters.page - 3),
    data.filters.page + 2,
  );

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Roles & Access Layers</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Define operator roles with the blast radius visible before you save.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This workspace keeps role creation, editing, and assignment context in one place so operators can see who a
              role affects and what permission surface it already carries.
            </p>
          </div>

        </div>
      </section>

      <section className="legal-panel p-4 md:p-6">
        <form className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
          <AdminSearchField
            defaultValue={data.filters.q}
            placeholder="Search role name or description"
            listId="role-suggestions"
            suggestions={data.catalog.map((role) => role.name)}
          />
          <button type="submit" className="legal-button-primary w-full xl:w-auto">
            Apply Filter
          </button>
          <Link href="/roles" className="legal-button-secondary w-full xl:w-auto">
            Reset
          </Link>
        </form>
      </section>

      <RoleCatalogManager
        roles={data.rows}
        pagination={{
          start: data.pagination.start,
          end: data.pagination.end,
          total: data.pagination.total,
          currentPage: data.filters.page,
          pageLinks: visiblePages.map((pageNumber) => ({
            pageNumber,
            href: buildQueryString(data.filters, { page: pageNumber }),
          })),
          previousHref: buildQueryString(data.filters, { page: Math.max(1, data.filters.page - 1) }),
          nextHref: buildQueryString(data.filters, { page: Math.min(data.pagination.totalPages, data.filters.page + 1) }),
          isFirstPage: data.filters.page === 1,
          isLastPage: data.filters.page === data.pagination.totalPages,
        }}
      />
    </div>
  );
}
