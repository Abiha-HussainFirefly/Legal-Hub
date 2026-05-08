import UserAdminTable from "@/app/(admin)/user/UserAdminTable";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminUsersPageData } from "@/lib/services/admin.server";
import { BadgeCheck, KeyRound, Shield, UserCog } from "lucide-react";
import Link from "next/link";

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: Date | null) {
  if (!value) return "No login yet";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function buildQueryString(
  filters: {
    q: string;
    status: string;
    userType: string;
    role: string;
    verification: string;
    identifier: string;
    mfa: string;
    risk: string;
    createdFrom: string;
    createdTo: string;
    lastLoginFrom: string;
    lastLoginTo: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    status: string;
    userType: string;
    role: string;
    verification: string;
    identifier: string;
    mfa: string;
    risk: string;
    createdFrom: string;
    createdTo: string;
    lastLoginFrom: string;
    lastLoginTo: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.userType) params.set("userType", next.userType);
  if (next.role) params.set("role", next.role);
  if (next.verification) params.set("verification", next.verification);
  if (next.identifier) params.set("identifier", next.identifier);
  if (next.mfa) params.set("mfa", next.mfa);
  if (next.risk) params.set("risk", next.risk);
  if (next.createdFrom) params.set("createdFrom", next.createdFrom);
  if (next.createdTo) params.set("createdTo", next.createdTo);
  if (next.lastLoginFrom) params.set("lastLoginFrom", next.lastLoginFrom);
  if (next.lastLoginTo) params.set("lastLoginTo", next.lastLoginTo);
  if (next.page > 1) params.set("page", `${next.page}`);

  const query = params.toString();
  return query ? `/user?${query}` : "/user";
}

export default async function UserPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminUsersPageData({
    q: getFirstParam(resolvedSearchParams.q),
    status: getFirstParam(resolvedSearchParams.status),
    userType: getFirstParam(resolvedSearchParams.userType),
    role: getFirstParam(resolvedSearchParams.role),
    verification: getFirstParam(resolvedSearchParams.verification),
    identifier: getFirstParam(resolvedSearchParams.identifier),
    mfa: getFirstParam(resolvedSearchParams.mfa),
    risk: getFirstParam(resolvedSearchParams.risk),
    createdFrom: getFirstParam(resolvedSearchParams.createdFrom),
    createdTo: getFirstParam(resolvedSearchParams.createdTo),
    lastLoginFrom: getFirstParam(resolvedSearchParams.lastLoginFrom),
    lastLoginTo: getFirstParam(resolvedSearchParams.lastLoginTo),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const summaryCards = [
    {
      title: "Total Users",
      value: formatNumber(data.summary.totalUsers),
      detail: `${formatNumber(data.pagination.total)} matching current filters`,
      icon: UserCog,
    },
    {
      title: "Privileged Accounts",
      value: formatNumber(data.summary.privilegedUsers),
      detail: "Admin, super admin, and moderator roles",
      icon: Shield,
    },
    {
      title: "MFA Enabled",
      value: formatNumber(data.summary.mfaEnabledUsers),
      detail: "Accounts with at least one active factor",
      icon: KeyRound,
    },
    {
      title: "Verified Lawyers",
      value: formatNumber(data.summary.verifiedLawyers),
      detail: "Authoritative trust signal from LawyerProfile",
      icon: BadgeCheck,
    },
  ];

  const currentFilters = data.filters;
  const visiblePages = Array.from(
    { length: data.pagination.totalPages },
    (_, index) => index + 1,
  ).slice(Math.max(0, currentFilters.page - 3), currentFilters.page + 2);

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Users & Identity</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Real identity search, status filtering, and trust visibility.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page reads live user, role, identifier, MFA, and lawyer-verification data from the platform.
              The surface stays intentionally read-mostly so account controls sit on top of reliable identity records.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Current result window</p>
            <p className="mt-2 text-base font-semibold text-[#2F1D3B]">
              {data.pagination.start} to {data.pagination.end} of {formatNumber(data.pagination.total)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="legal-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{card.title}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{card.value}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{card.detail}</p>
                </div>
                <div className="rounded-[18px] bg-[#F4EFF8] p-3 text-[#4C2F5E]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="legal-panel p-4 md:p-6">
        <form className="grid gap-4 xl:grid-cols-4">
          <AdminSearchField
            defaultValue={currentFilters.q}
            placeholder="Search ID, name, username, email, phone, or organization"
          />

          <select name="status" defaultValue={currentFilters.status} className="legal-field">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DISABLED">Disabled</option>
            <option value="DELETED">Deleted</option>
          </select>

          <select name="userType" defaultValue={currentFilters.userType} className="legal-field">
            <option value="">All user types</option>
            <option value="EXTERNAL">External</option>
            <option value="SYSTEM">System</option>
          </select>

          <select name="role" defaultValue={currentFilters.role} className="legal-field">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
            <option value="moderator">Moderator</option>
            <option value="lawyer">Lawyer</option>
            <option value="member">Member</option>
          </select>

          <select name="verification" defaultValue={currentFilters.verification} className="legal-field">
            <option value="">All verification states</option>
            <option value="VERIFIED">Verified lawyer</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
            <option value="NOT_SUBMITTED">Not submitted</option>
          </select>

          <select name="identifier" defaultValue={currentFilters.identifier} className="legal-field">
            <option value="">All identifier states</option>
            <option value="verified">Has verified identifier</option>
            <option value="unverified">Has unverified identifier</option>
          </select>

          <select name="mfa" defaultValue={currentFilters.mfa} className="legal-field">
            <option value="">All MFA states</option>
            <option value="enabled">MFA enabled</option>
            <option value="disabled">MFA missing</option>
          </select>

          <select name="risk" defaultValue={currentFilters.risk} className="legal-field">
            <option value="">All risk states</option>
            <option value="high">Recent failed logins</option>
          </select>

          <input type="date" name="createdFrom" defaultValue={currentFilters.createdFrom} className="legal-field" />
          <input type="date" name="createdTo" defaultValue={currentFilters.createdTo} className="legal-field" />
          <input type="date" name="lastLoginFrom" defaultValue={currentFilters.lastLoginFrom} className="legal-field" />
          <input type="date" name="lastLoginTo" defaultValue={currentFilters.lastLoginTo} className="legal-field" />

          <div className="flex items-center gap-3 xl:col-span-4">
            <button type="submit" className="legal-button-primary w-full xl:w-auto">
              Apply Filters
            </button>
            <Link href="/user" className="legal-button-secondary w-full xl:w-auto">
              Reset
            </Link>
          </div>
        </form>
      </section>

      <UserAdminTable
        rows={data.rows.map((user) => ({
          ...user,
          lastLoginLabel: formatDate(user.lastLoginAt),
          createdAtLabel: formatDate(user.createdAt),
        }))}
        pagination={data.pagination}
        currentPage={currentFilters.page}
        pageLinks={visiblePages.map((pageNumber) => ({
          pageNumber,
          href: buildQueryString(currentFilters, { page: pageNumber }),
        }))}
        previousHref={buildQueryString(currentFilters, { page: Math.max(1, currentFilters.page - 1) })}
        nextHref={buildQueryString(currentFilters, { page: Math.min(data.pagination.totalPages, currentFilters.page + 1) })}
        isFirstPage={currentFilters.page === 1}
        isLastPage={currentFilters.page === data.pagination.totalPages}
      />
    </div>
  );
}
