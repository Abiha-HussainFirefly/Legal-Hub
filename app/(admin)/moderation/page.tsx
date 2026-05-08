import { adminAlertWorkflowAction, adminReportWorkflowAction } from "@/app/actions/admin-moderation";
import AdminPagination from "@/app/components/admin/AdminPagination";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminModerationQueueData } from "@/lib/services/admin.server";
import { AlertTriangle, Bot, Gavel } from "lucide-react";
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
    tab: "reports" | "alerts" | "actions";
    targetType: string;
    severity: string;
    status: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    tab: "reports" | "alerts" | "actions";
    targetType: string;
    severity: string;
    status: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.tab && next.tab !== "reports") params.set("tab", next.tab);
  if (next.targetType) params.set("targetType", next.targetType);
  if (next.severity) params.set("severity", next.severity);
  if (next.status) params.set("status", next.status);
  if (next.page > 1) params.set("page", `${next.page}`);

  const query = params.toString();
  return query ? `/moderation?${query}` : "/moderation";
}

function severityClasses(value: string) {
  if (value === "CRITICAL") return "bg-[#FCE8E6] text-[#A33A31]";
  if (value === "HIGH") return "bg-[#F6EBD6] text-[#8B642A]";
  return "bg-[#EEF2F7] text-[#36506E]";
}

function statusClasses(value: string) {
  if (value === "RESOLVED" || value === "ACTIONED") return "bg-[#E6F5EF] text-[#0E7A55]";
  if (value === "DISMISSED" || value === "FALSE_POSITIVE") return "bg-[#EEF2F7] text-[#36506E]";
  return "bg-[#F6EBD6] text-[#8B642A]";
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminModerationQueueData({
    q: getFirstParam(resolvedSearchParams.q),
    tab: getFirstParam(resolvedSearchParams.tab),
    targetType: getFirstParam(resolvedSearchParams.targetType),
    severity: getFirstParam(resolvedSearchParams.severity),
    status: getFirstParam(resolvedSearchParams.status),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const currentFilters = data.filters;
  const visiblePages = Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentFilters.page - 3),
    currentFilters.page + 2,
  );

  const summaryCards = [
    {
      title: "Open Reports",
      value: formatNumber(data.summary.openReports),
      detail: "Report inbox items still awaiting resolution",
      icon: AlertTriangle,
    },
    {
      title: "Open AI Alerts",
      value: formatNumber(data.summary.openAlerts),
      detail: `${formatNumber(data.summary.criticalAlerts)} marked critical`,
      icon: Bot,
    },
    {
      title: "Actions Last 7 Days",
      value: formatNumber(data.summary.actionsLast7d),
      detail: "Moderation decisions already written to the ledger",
      icon: Gavel,
    },
  ];

  const tabLinks: Array<{ key: "reports" | "alerts" | "actions"; label: string }> = [
    { key: "reports", label: "Reports" },
    { key: "alerts", label: "AI Alerts" },
    { key: "actions", label: "Action Log" },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Moderation Center</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Reports, AI alerts, and enforcement history now share one real queue.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page reads `ContentReport`, `AIAlert`, and `ModerationAction` data from the same source of truth
              so queue triage and enforcement history stay aligned.
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <section className="legal-panel overflow-hidden">
        <div className="flex gap-4 border-b border-[#ECE7F2] px-6 pt-5">
          {tabLinks.map((tab) => (
            <Link
              key={tab.key}
              href={buildQueryString(currentFilters, { tab: tab.key, page: 1, severity: tab.key === "alerts" ? currentFilters.severity : "", status: tab.key === "actions" ? "" : currentFilters.status })}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                currentFilters.tab === tab.key
                  ? "border-[#4C2F5E] text-[#2F1D3B]"
                  : "border-transparent text-slate-500 hover:text-[#2F1D3B]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="p-4 md:p-6">
          <form className="grid gap-4 xl:grid-cols-4">
            <input type="hidden" name="tab" value={currentFilters.tab} />
            <AdminSearchField
              defaultValue={currentFilters.q}
              placeholder="Search title, reason, source, reporter, moderator"
              wrapperClassName="xl:col-span-2"
            />

            <select name="targetType" defaultValue={currentFilters.targetType} className="legal-field">
              <option value="">All target types</option>
              <option value="DISCUSSION">Discussion</option>
              <option value="ANSWER">Answer</option>
              <option value="COMMENT">Comment</option>
              <option value="CASE">Case</option>
            </select>

            {currentFilters.tab === "alerts" ? (
              <select name="severity" defaultValue={currentFilters.severity} className="legal-field">
                <option value="">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            ) : currentFilters.tab === "actions" ? (
              <div />
            ) : (
              <div />
            )}

            {currentFilters.tab === "reports" ? (
              <select name="status" defaultValue={currentFilters.status} className="legal-field">
                <option value="">Open queue default</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="ACTIONED">Actioned</option>
                <option value="DISMISSED">Dismissed</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            ) : currentFilters.tab === "alerts" ? (
              <select name="status" defaultValue={currentFilters.status} className="legal-field">
                <option value="">Open queue default</option>
                <option value="OPEN">Open</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="RESOLVED">Resolved</option>
                <option value="FALSE_POSITIVE">False positive</option>
              </select>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3 xl:col-span-4">
              <button type="submit" className="legal-button-primary w-full xl:w-auto">
                Apply Filters
              </button>
              <Link href={buildQueryString(currentFilters, { q: "", targetType: "", severity: "", status: "", page: 1 })} className="legal-button-secondary w-full xl:w-auto">
                Reset
              </Link>
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          {currentFilters.tab === "reports" ? (
            <table className="legal-table w-full min-w-[980px]">
              <thead>
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Target</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Reporter</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Reason</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Created</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Reviewer</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.reports.length ? (
                  data.reports.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-4 align-top">
                        <Link href={row.targetHref} className="text-sm font-semibold text-[#2F1D3B] hover:text-[#4C2F5E]">
                          {row.targetLabel}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{prettyText(row.targetType)}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <p>{row.reporterName}</p>
                        {row.reportedUserName ? <p className="mt-1 text-xs text-slate-500">Reported user: {row.reportedUserName}</p> : null}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <p>{prettyText(row.reason)}</p>
                        {row.description ? <p className="mt-1 text-xs text-slate-500">{row.description}</p> : null}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                          {prettyText(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <p>{formatDate(row.createdAt)}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.reviewedAt ? `Reviewed ${formatDate(row.reviewedAt)}` : "Awaiting review"}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <p>{row.reviewer ?? "Unassigned"}</p>
                        {row.resolutionNote ? <p className="mt-1 text-xs text-slate-500">Note: {row.resolutionNote}</p> : null}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <form action={adminReportWorkflowAction} className="space-y-2">
                          <input type="hidden" name="reportId" value={row.id} />
                          <input
                            type="text"
                            name="note"
                            placeholder="Review note or resolution reason"
                            className="legal-field w-full min-w-[220px] text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            {row.status === "OPEN" ? (
                              <button type="submit" name="intent" value="under_review" className="legal-button-secondary text-xs">
                                Under review
                              </button>
                            ) : null}
                            <button type="submit" name="intent" value="resolve" className="legal-button-primary text-xs">
                              Resolve
                            </button>
                            <button type="submit" name="intent" value="dismiss" className="legal-button-secondary text-xs">
                              Dismiss
                            </button>
                            <button type="submit" name="intent" value="hide_target" className="legal-button-secondary text-xs">
                              Hide target
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      No content reports match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : null}

          {currentFilters.tab === "alerts" ? (
            <table className="legal-table w-full min-w-[980px]">
              <thead>
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Alert</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Target</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Severity</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Source</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Review Trace</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.alerts.length ? (
                  data.alerts.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <p className="font-semibold text-[#2F1D3B]">{row.title}</p>
                        {row.description ? <p className="mt-1 text-xs text-slate-500">{row.description}</p> : null}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Link href={row.targetHref} className="text-sm font-semibold text-[#2F1D3B] hover:text-[#4C2F5E]">
                          {row.targetLabel}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{prettyText(row.targetType)}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${severityClasses(row.severity)}`}>
                          {prettyText(row.severity)}
                        </span>
                        {row.riskScore !== null ? <p className="mt-1 text-xs text-slate-500">Risk score {row.riskScore}</p> : null}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                          {prettyText(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{row.source}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <p>{formatDate(row.detectedAt)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.reviewer ? `Reviewed by ${row.reviewer}` : "Awaiting reviewer"}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <form action={adminAlertWorkflowAction} className="space-y-2">
                          <input type="hidden" name="alertId" value={row.id} />
                          <input
                            type="text"
                            name="note"
                            placeholder="Resolution note or moderation reason"
                            className="legal-field w-full min-w-[220px] text-sm"
                          />
                          <div className="flex flex-wrap gap-2">
                            {row.status === "OPEN" ? (
                              <button type="submit" name="intent" value="acknowledge" className="legal-button-secondary text-xs">
                                Acknowledge
                              </button>
                            ) : null}
                            <button type="submit" name="intent" value="resolve" className="legal-button-primary text-xs">
                              Resolve
                            </button>
                            <button type="submit" name="intent" value="false_positive" className="legal-button-secondary text-xs">
                              False positive
                            </button>
                            <button type="submit" name="intent" value="hide_target" className="legal-button-secondary text-xs">
                              Hide target
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      No AI alerts match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : null}

          {currentFilters.tab === "actions" ? (
            <table className="legal-table w-full min-w-[920px]">
              <thead>
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Action</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Target</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Moderator</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Reason</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.actions.length ? (
                  data.actions.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">
                        <p className="font-semibold text-[#2F1D3B]">{prettyText(row.actionType)}</p>
                        {row.note ? <p className="mt-1 text-xs text-slate-500">{row.note}</p> : null}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Link href={row.targetHref} className="text-sm font-semibold text-[#2F1D3B] hover:text-[#4C2F5E]">
                          {row.targetLabel}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{prettyText(row.targetType)}</p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{row.moderator}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{row.reason ?? "No reason captured"}</td>
                      <td className="px-4 py-4 align-top text-sm text-slate-600">{formatDate(row.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                      No moderation actions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : null}
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
