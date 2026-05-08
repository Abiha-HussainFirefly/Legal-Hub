import AdminPagination from "@/app/components/admin/AdminPagination";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminDiscussionsPageData } from "@/lib/services/admin-discussions.server";
import { Bot, MessageSquareText, Pin, ShieldAlert } from "lucide-react";
import Link from "next/link";

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function prettyText(value: string | null) {
  if (!value) return "None";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildQueryString(
  filters: {
    q: string;
    kind: string;
    status: string;
    contentStatus: string;
    visibility: string;
    pinned: string;
    aiSummary: string;
    signals: string;
    sort: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    kind: string;
    status: string;
    contentStatus: string;
    visibility: string;
    pinned: string;
    aiSummary: string;
    signals: string;
    sort: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.kind) params.set("kind", next.kind);
  if (next.status) params.set("status", next.status);
  if (next.contentStatus) params.set("contentStatus", next.contentStatus);
  if (next.visibility) params.set("visibility", next.visibility);
  if (next.pinned) params.set("pinned", next.pinned);
  if (next.aiSummary) params.set("aiSummary", next.aiSummary);
  if (next.signals) params.set("signals", next.signals);
  if (next.sort) params.set("sort", next.sort);
  if (next.page > 1) params.set("page", `${next.page}`);

  const query = params.toString();
  return query ? `/discussion-ops?${query}` : "/discussion-ops";
}

function statusClasses(value: string) {
  if (value === "ACTIVE" || value === "OPEN" || value === "GENERATED") return "bg-[#E6F5EF] text-[#0E7A55]";
  if (value === "HIDDEN" || value === "REMOVED" || value === "FAILED" || value === "DELETED") {
    return "bg-[#FCE8E6] text-[#A33A31]";
  }
  return "bg-[#F6EBD6] text-[#8B642A]";
}

export default async function DiscussionOpsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminDiscussionsPageData({
    q: getFirstParam(resolvedSearchParams.q),
    kind: getFirstParam(resolvedSearchParams.kind),
    status: getFirstParam(resolvedSearchParams.status),
    contentStatus: getFirstParam(resolvedSearchParams.contentStatus),
    visibility: getFirstParam(resolvedSearchParams.visibility),
    pinned: getFirstParam(resolvedSearchParams.pinned),
    aiSummary: getFirstParam(resolvedSearchParams.aiSummary),
    signals: getFirstParam(resolvedSearchParams.signals),
    sort: getFirstParam(resolvedSearchParams.sort),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const currentFilters = data.filters;
  const visiblePages = Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentFilters.page - 3),
    currentFilters.page + 2,
  );

  const summaryCards = [
    {
      title: "Visible Threads",
      value: formatNumber(data.summary.total),
      detail: "Discussions matching the current admin filter state",
      icon: MessageSquareText,
    },
    {
      title: "Pinned Threads",
      value: formatNumber(data.summary.pinned),
      detail: "Threads currently surfaced above the normal feed",
      icon: Pin,
    },
    {
      title: "Flagged Threads",
      value: formatNumber(data.summary.flagged),
      detail: "Threads with open reports or acknowledged/open AI alerts",
      icon: ShieldAlert,
    },
    {
      title: "AI Pending",
      value: formatNumber(data.summary.pendingAiSummaries),
      detail: "Current discussion summaries still waiting to complete",
      icon: Bot,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="legal-kicker">Discussion Operations</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Govern thread quality, AI summaries, and moderation signals from one queue.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This workspace separates discussion workflow state from moderation state and surfaces thread activity,
              engagement, AI-summary health, and linked trust signals in one reviewer-oriented list.
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
        <form className="grid gap-4 xl:grid-cols-5">
          <AdminSearchField
            defaultValue={currentFilters.q}
            placeholder="Search title, slug, author, category, tag, case, or ID"
            wrapperClassName="xl:col-span-2"
          />

          <select name="kind" defaultValue={currentFilters.kind} className="legal-field">
            <option value="">All kinds</option>
            <option value="QUESTION">Question</option>
            <option value="DISCUSSION">Discussion</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="LEGAL_UPDATE">Legal update</option>
          </select>

          <select name="status" defaultValue={currentFilters.status} className="legal-field">
            <option value="">All workflow states</option>
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="LOCKED">Locked</option>
            <option value="HIDDEN">Hidden</option>
            <option value="DELETED">Deleted</option>
          </select>

          <select name="contentStatus" defaultValue={currentFilters.contentStatus} className="legal-field">
            <option value="">All moderation states</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_MODERATION">Pending moderation</option>
            <option value="FLAGGED">Flagged</option>
            <option value="HIDDEN">Hidden</option>
            <option value="REMOVED">Removed</option>
            <option value="DELETED">Deleted</option>
          </select>

          <select name="visibility" defaultValue={currentFilters.visibility} className="legal-field">
            <option value="">All visibilities</option>
            <option value="PUBLIC">Public</option>
            <option value="UNLISTED">Unlisted</option>
            <option value="PRIVATE">Private</option>
            <option value="ORGANIZATION">Organization</option>
          </select>

          <select name="pinned" defaultValue={currentFilters.pinned} className="legal-field">
            <option value="">Any pin state</option>
            <option value="yes">Pinned only</option>
            <option value="no">Not pinned</option>
          </select>

          <select name="aiSummary" defaultValue={currentFilters.aiSummary} className="legal-field">
            <option value="">Any AI summary state</option>
            <option value="generated">Generated</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="stale">Stale</option>
            <option value="missing">Missing</option>
          </select>

          <select name="signals" defaultValue={currentFilters.signals} className="legal-field">
            <option value="">Any moderation signal state</option>
            <option value="flagged">Has open signals</option>
          </select>

          <select name="sort" defaultValue={currentFilters.sort} className="legal-field">
            <option value="last_activity">Last activity</option>
            <option value="newest">Newest</option>
            <option value="most_viewed">Most viewed</option>
            <option value="most_answered">Most answered</option>
            <option value="most_reacted">Most reacted</option>
            <option value="oldest_unresolved">Oldest unresolved</option>
          </select>

          <div className="flex items-center gap-3 xl:col-span-5">
            <button type="submit" className="legal-button-primary w-full xl:w-auto">
              Apply Filters
            </button>
            <Link href="/discussion-ops" className="legal-button-secondary w-full xl:w-auto">
              Reset
            </Link>
          </div>
        </form>
      </section>

      <div className="space-y-4">
        {data.rows.length ? (
          data.rows.map((row) => (
            <article key={row.id} className="legal-panel p-5 md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                      {prettyText(row.status)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(row.contentStatus)}`}>
                      {prettyText(row.contentStatus)}
                    </span>
                    <span className="workspace-pill">{prettyText(row.kind)}</span>
                    <span className="workspace-pill">{prettyText(row.visibility)}</span>
                    {row.isPinned ? <span className="workspace-pill">Pinned</span> : null}
                    {row.aiSummaryStatus ? <span className="workspace-pill">AI {prettyText(row.aiSummaryStatus)}</span> : null}
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#102033]">{row.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {row.authorName} / {row.categoryName}
                    {row.organizationName ? ` / ${row.organizationName}` : ""}
                    {row.regionName ? ` / ${row.regionName}` : ""}
                    {row.relatedCaseTitle ? ` / Related case: ${row.relatedCaseTitle}` : ""}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Engagement</p>
                      <p className="mt-2 text-sm text-[#2F1D3B]">
                        {row.answerCount} answers / {row.commentCount} comments / {row.reactionCount} reactions
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Reach</p>
                      <p className="mt-2 text-sm text-[#2F1D3B]">
                        {row.viewCount} views / {row.followerCount} follows / {row.bookmarkCount} saves
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Signals</p>
                      <p className="mt-2 text-sm text-[#2F1D3B]">
                        {row.openReports} reports / {row.openAlerts} AI alerts / {row.boostCount} boosts
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Activity</p>
                      <p className="mt-2 text-sm text-[#2F1D3B]">{formatDateTime(row.lastActivityAt)}</p>
                      <p className="mt-1 text-xs text-slate-500">Created {formatDateTime(row.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="xl:w-[220px]">
                  <Link href={`/discussion-ops/${row.slug}`} className="legal-button-primary w-full text-sm">
                    Open Workspace
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <section className="legal-panel p-6">
            <p className="text-sm text-slate-500">No discussions match the current filters.</p>
          </section>
        )}
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
    </div>
  );
}
