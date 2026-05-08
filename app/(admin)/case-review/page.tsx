import { CaseSourceBadge, CaseStatusBadge, CaseVisibilityBadge } from "@/app/components/cases/case-badges";
import CaseEmptyState from "@/app/components/cases/case-empty-state";
import CasePageHero from "@/app/components/cases/case-page-hero";
import AdminPagination from "@/app/components/admin/AdminPagination";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminCaseReviewQueueData } from "@/lib/services/admin.server";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import Link from "next/link";

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | null) {
  if (!value) return "Not reviewed";

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
    sourceType: string;
    region: string;
    court: string;
    organization: string;
    reviewedBy: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    status: string;
    sourceType: string;
    region: string;
    court: string;
    organization: string;
    reviewedBy: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.sourceType) params.set("sourceType", next.sourceType);
  if (next.region) params.set("region", next.region);
  if (next.court) params.set("court", next.court);
  if (next.organization) params.set("organization", next.organization);
  if (next.reviewedBy) params.set("reviewedBy", next.reviewedBy);
  if (next.page > 1) params.set("page", `${next.page}`);

  const query = params.toString();
  return query ? `/case-review?${query}` : "/case-review";
}

export default async function CaseReviewQueuePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminCaseReviewQueueData({
    q: getFirstParam(resolvedSearchParams.q),
    status: getFirstParam(resolvedSearchParams.status),
    sourceType: getFirstParam(resolvedSearchParams.sourceType),
    region: getFirstParam(resolvedSearchParams.region),
    court: getFirstParam(resolvedSearchParams.court),
    organization: getFirstParam(resolvedSearchParams.organization),
    reviewedBy: getFirstParam(resolvedSearchParams.reviewedBy),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const currentFilters = data.filters;
  const visiblePages = Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentFilters.page - 3),
    currentFilters.page + 2,
  );

  const metrics = [
    { label: "Queue size", value: `${data.summary.queueSize}`, icon: BriefcaseBusiness },
    { label: "Pending review", value: `${data.summary.pendingReview}`, icon: Clock3 },
    { label: "Rejected / fixes", value: `${data.summary.rejected}`, icon: AlertTriangle },
    { label: "Ready to publish", value: `${data.summary.readyToPublish}`, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <CasePageHero
        kicker="Reviewer queue"
        title="Case Review Console"
        description="Review contributor drafts, validate provenance and source health, and move repository records into publishable state."
        aside={
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Quality controls</p>
            <div className="grid gap-3">
              {[
                "Check source health before public release.",
                "Confirm holding language is neutral and legally precise.",
                "Verify organization and visibility boundaries.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3 text-sm leading-7 text-white/78"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        }
        metrics={metrics.map(({ label, value, icon }) => ({ label, value, icon }))}
      />

      <section className="legal-panel p-4 md:p-6">
        <form className="grid gap-4 xl:grid-cols-4">
          <AdminSearchField
            defaultValue={currentFilters.q}
            placeholder="Search title, citation, author, organization, or category"
            wrapperClassName="xl:col-span-2"
          />

          <select name="status" defaultValue={currentFilters.status} className="legal-field">
            <option value="">Queue default statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="REJECTED">Rejected</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
            <option value="REMOVED">Removed</option>
          </select>

          <select name="sourceType" defaultValue={currentFilters.sourceType} className="legal-field">
            <option value="">All source types</option>
            <option value="USER_SUBMITTED">User submitted</option>
            <option value="OFFICIAL_COURT">Official court</option>
            <option value="IMPORTED_EDITORIAL">Imported editorial</option>
            <option value="COMMUNITY_CURATED">Community curated</option>
          </select>

          <input type="text" name="region" defaultValue={currentFilters.region} placeholder="Filter by region" className="legal-field" />
          <input type="text" name="court" defaultValue={currentFilters.court} placeholder="Filter by court" className="legal-field" />
          <input
            type="text"
            name="organization"
            defaultValue={currentFilters.organization}
            placeholder="Filter by organization"
            className="legal-field"
          />
          <input
            type="text"
            name="reviewedBy"
            defaultValue={currentFilters.reviewedBy}
            placeholder="Filter by reviewer"
            className="legal-field"
          />

          <div className="flex items-center gap-3 xl:col-span-4">
            <button type="submit" className="legal-button-primary w-full xl:w-auto">
              Apply Filters
            </button>
            <Link href="/case-review" className="legal-button-secondary w-full xl:w-auto">
              Reset
            </Link>
          </div>
        </form>
      </section>

      {data.rows.length ? (
        <div className="space-y-4">
          {data.rows.map((item) => (
            <article key={item.id} className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <CaseStatusBadge status={item.status} />
                    <CaseVisibilityBadge visibility={item.visibility} />
                    <CaseSourceBadge sourceType={item.sourceType} />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">
                    {item.canonicalCitation ?? "Citation pending"}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{item.title}</h2>
                  <p className="mt-4 text-sm leading-8 text-[#706181]">{item.summary ?? "Summary not yet provided."}</p>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Contributor</p>
                      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{item.authorName}</p>
                      <p className="mt-1 text-xs text-[#706181]">{item.organizationName ?? "Independent contributor"}</p>
                    </div>
                    <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Routing</p>
                      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{item.courtName ?? "Court pending"}</p>
                      <p className="mt-1 text-xs text-[#706181]">{item.regionName ?? item.categoryName}</p>
                    </div>
                    <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Source health</p>
                      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">
                        {item.sourceLinkCount} links / {item.sourceFileCount} files
                      </p>
                      <p className="mt-1 text-xs text-[#706181]">
                        {item.flaggedFileCount > 0
                          ? `${item.flaggedFileCount} file scan issue${item.flaggedFileCount === 1 ? "" : "s"}`
                          : "No file scan exceptions"}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Flags</p>
                      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">
                        {item.aiAlerts} AI alerts / {item.openReports} reports
                      </p>
                      <p className="mt-1 text-xs text-[#706181]">
                        {item.reviewedBy ? `Reviewed by ${item.reviewedBy}` : `Created ${formatDate(item.createdAt)}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="xl:w-[240px]">
                  <Link href={`/case-review/${item.slug}`} className="legal-button-primary w-full text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Open review detail
                  </Link>
                </div>
              </div>
            </article>
          ))}

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
        </div>
      ) : (
        <CaseEmptyState
          icon={BriefcaseBusiness}
          title="No records in the review queue"
          description="Reviewer-facing drafts and rejected cases will appear here once contributors submit them."
        />
      )}
    </div>
  );
}
