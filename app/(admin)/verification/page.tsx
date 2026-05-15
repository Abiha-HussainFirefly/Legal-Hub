import { adminVerificationDecisionAction } from "@/app/actions/admin-review";
import AdminPagination from "@/app/components/admin/AdminPagination";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminVerificationQueueData } from "@/lib/services/admin.server";
import { BadgeCheck, Clock3, FileWarning, ShieldCheck } from "lucide-react";
import Link from "next/link";

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: Date | null) {
  if (!value) return "Not reviewed";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatAgeLabel(value: Date) {
  const diff = Date.now() - value.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function prettyText(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildQueryString(
  filters: {
    q: string;
    status: string;
    region: string;
    missingDocs: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    status: string;
    region: string;
    missingDocs: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.region) params.set("region", next.region);
  if (next.missingDocs) params.set("missingDocs", next.missingDocs);
  if (next.page > 1) params.set("page", `${next.page}`);

  const query = params.toString();
  return query ? `/verification?${query}` : "/verification";
}

function statusClasses(status: string) {
  if (status === "VERIFIED") return "bg-[#E6F5EF] text-[#0E7A55]";
  if (status === "REJECTED" || status === "EXPIRED") return "bg-[#FCE8E6] text-[#A33A31]";
  return "bg-[#F6EBD6] text-[#8B642A]";
}

async function verificationDecisionAction(formData: FormData): Promise<void> {
  await adminVerificationDecisionAction(null, formData);
}

export default async function VerificationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminVerificationQueueData({
    q: getFirstParam(resolvedSearchParams.q),
    status: getFirstParam(resolvedSearchParams.status),
    region: getFirstParam(resolvedSearchParams.region),
    missingDocs: getFirstParam(resolvedSearchParams.missingDocs),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const currentFilters = data.filters;
  const visiblePages = Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentFilters.page - 3),
    currentFilters.page + 2,
  );

  const summaryCards = [
    {
      title: "Open Requests",
      value: formatNumber(data.summary.openRequests),
      detail: "Pending and under-review verification work",
      icon: Clock3,
    },
    {
      title: "Verified Lawyers",
      value: formatNumber(data.summary.verifiedLawyers),
      detail: "Authoritative LawyerProfile trust state",
      icon: ShieldCheck,
    },
    {
      title: "Rejected Requests",
      value: formatNumber(data.summary.rejectedRequests),
      detail: "Review outcomes requiring resubmission or closure",
      icon: BadgeCheck,
    },
    {
      title: "Missing Documents",
      value: formatNumber(data.summary.missingDocuments),
      detail: "Open requests without the current required document set",
      icon: FileWarning,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Lawyer Verification</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Review lawyer verification requests from the live trust queue.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page now reads `LawyerVerificationRequest`, linked documents, file scan posture, and the underlying
              `LawyerProfile` trust state directly from Prisma.
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
            placeholder="Search applicant, username, bar council, or license number"
            wrapperClassName="xl:col-span-2"
          />

          <select name="status" defaultValue={currentFilters.status} className="legal-field">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <input
            type="text"
            name="region"
            defaultValue={currentFilters.region}
            placeholder="Filter by region"
            className="legal-field"
          />

          <select name="missingDocs" defaultValue={currentFilters.missingDocs} className="legal-field xl:col-span-2">
            <option value="">All document states</option>
            <option value="yes">Missing required documents</option>
          </select>

          <div className="flex items-center gap-3 xl:col-span-2">
            <button type="submit" className="legal-button-primary w-full xl:w-auto">
              Apply Filters
            </button>
            <Link href="/verification" className="legal-button-secondary w-full xl:w-auto">
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="legal-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="legal-table w-full min-w-[980px]">
            <thead>
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Applicant</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Bar Data</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Status</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Queue Age</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Documents</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Review Trace</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7F2]">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 align-top">
                      <div>
                        <p className="text-sm font-semibold text-[#2F1D3B]">{row.displayName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.username ? `@${row.username}` : "No username"}{row.regionName ? ` / ${row.regionName}` : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p>{row.barLicenseNumber ?? "No license number"}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.barCouncil ?? "No bar council captured"}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                        {prettyText(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p>{formatAgeLabel(row.submittedAt)}</p>
                      <p className="mt-1 text-xs text-slate-500">Submitted {formatDate(row.submittedAt)}</p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p>{row.documentCount} linked documents</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.missingRequiredDocuments.length
                          ? `Missing: ${row.missingRequiredDocuments.map(prettyText).join(", ")}`
                          : "Required docs present"}
                      </p>
                      {row.flaggedDocumentCount > 0 ? (
                        <p className="mt-1 text-xs font-medium text-[#A33A31]">
                          {row.flaggedDocumentCount} scan issue{row.flaggedDocumentCount === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p>{row.reviewedBy ?? "Awaiting reviewer"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.reviewedAt ? `Reviewed ${formatDate(row.reviewedAt)}` : "No review timestamp yet"}
                      </p>
                      {row.rejectionReason ? (
                        <p className="mt-1 text-xs text-[#A33A31]">Reason: {row.rejectionReason}</p>
                      ) : row.adminNote ? (
                        <p className="mt-1 text-xs text-slate-500">Note: {row.adminNote}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-3">
                        <Link href={`/user/${row.userId}?tab=trust`} className="text-sm font-semibold text-[#4C2F5E] hover:text-[#2F1D3B]">
                          Open trust tab
                        </Link>
                        {(row.status === "PENDING" || row.status === "UNDER_REVIEW") ? (
                          <form action={verificationDecisionAction} className="space-y-2">
                            <input type="hidden" name="requestId" value={row.id} />
                            <input
                              type="text"
                              name="decisionNote"
                              placeholder="Approval note or rejection reason"
                              className="legal-field w-full min-w-[220px] text-sm"
                            />
                            <div className="flex gap-2">
                              <button type="submit" name="intent" value="approve" className="legal-button-primary text-xs">
                                Approve
                              </button>
                              <button type="submit" name="intent" value="reject" className="legal-button-secondary text-xs">
                                Reject
                              </button>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No verification requests match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          start={data.pagination.start}
          end={data.pagination.end}
          total={data.pagination.total}
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
      </section>
    </div>
  );
}