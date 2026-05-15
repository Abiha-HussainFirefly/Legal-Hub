import { getAdminReportsData } from "@/lib/services/admin.server";
import { BarChart3, Download, Filter, Gavel, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function maxValue(values: number[]) {
  return Math.max(...values, 1);
}

function buildExportHref(
  filters: {
    rangeDays: number;
    bucket: "week" | "month";
    rankingLimit: number;
  },
  section: string,
  format: "csv" = "csv",
) {
  const params = new URLSearchParams({
    dataset: "reports",
    section,
  });

  if (filters.rangeDays !== 180) params.set("range", `${filters.rangeDays}`);
  if (filters.bucket !== "month") params.set("bucket", filters.bucket);
  if (filters.rankingLimit !== 5) params.set("rankingLimit", `${filters.rankingLimit}`);
  if (format !== "csv") params.set("format", format);

  return `/api/admin/exports?${params.toString()}`;
}

function TrendBars({
  rows,
  valueKey,
  tone = "bg-[#4C2F5E]",
}: {
  rows: Array<Record<string, string | number>>;
  valueKey: string;
  tone?: string;
}) {
  const max = maxValue(rows.map((row) => Number(row[valueKey] ?? 0)));

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const value = Number(row[valueKey] ?? 0);
        const width = `${Math.max(8, (value / max) * 100)}%`;

        return (
          <div key={String(row.label)} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[#2F1D3B]">{row.label}</span>
              <span className="text-slate-500">{formatNumber(value)}</span>
            </div>
            <div className="h-2 rounded-full bg-[#F1EAF6]">
              <div className={`h-2 rounded-full ${tone}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: "warning" | "stable" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "warning" ? "bg-[#FCE8E6] text-[#A33A31]" : "bg-[#E6F5EF] text-[#0E7A55]"
      }`}
    >
      {status === "warning" ? "Watch" : "Stable"}
    </span>
  );
}

function DownloadActions({ csvHref }: { csvHref: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={csvHref} className="legal-button-secondary inline-flex items-center gap-2 text-xs">
        <Download className="h-4 w-4" />
        Download CSV
      </a>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{eyebrow}</p>
        {title ? <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{title}</h2> : null}
        {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      {actions ?? null}
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminReportsData({
    range: getFirstParam(resolvedSearchParams.range),
    bucket: getFirstParam(resolvedSearchParams.bucket),
    rankingLimit: getFirstParam(resolvedSearchParams.rankingLimit),
  });

  const currentFilters = data.filters;
  const rangeLabel = `${currentFilters.rangeDays}d`;
  const bucketLabel = currentFilters.bucket === "week" ? "Weekly" : "Monthly";

  const summaryCards = [
    {
      title: `New Users ${rangeLabel}`,
      value: formatNumber(data.summary.newUsersInRange),
      detail: `Accounts created across the last ${currentFilters.rangeDays} days`,
      icon: Users,
    },
    {
      title: `Published Cases ${rangeLabel}`,
      value: formatNumber(data.summary.publishedCasesInRange),
      detail: `Repository items that reached published state in the last ${currentFilters.rangeDays} days`,
      icon: Gavel,
    },
    {
      title: "Open Moderation Signals",
      value: formatNumber(data.summary.openModerationSignals),
      detail: "Current open reports plus acknowledged/open AI alerts",
      icon: ShieldAlert,
    },
    {
      title: "Verification Approval Rate",
      value: data.summary.verificationApprovalRateInRange === null ? "N/A" : `${data.summary.verificationApprovalRateInRange}%`,
      detail: `Decided lawyer verification requests in the last ${currentFilters.rangeDays} days`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Analytics & Reports</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Live platform reporting now supports filtered analytics and direct exports.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page reads Prisma-backed platform activity and lets admins narrow the reporting window, change the
              aggregation cadence, and export the same filtered report state to CSV.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Current filter set</p>
              <p className="mt-2 text-base font-semibold text-[#2F1D3B]">
                {rangeLabel} / {bucketLabel} / Top {currentFilters.rankingLimit}
              </p>
            </div>

            <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Last refresh</p>
              <p className="mt-2 text-base font-semibold text-[#2F1D3B]">{formatTimestamp(data.generatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="legal-panel p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-[18px] bg-[#F4EFF8] p-3 text-[#4C2F5E]">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Report Filters</h2>
            <p className="mt-1 text-sm leading-7 text-slate-600">
              Change the analysis window once, then export the exact same filtered report state.
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-4 xl:grid-cols-3">
          <select name="range" defaultValue={`${currentFilters.rangeDays}`} className="legal-field">
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
            <option value="365">Last 365 days</option>
          </select>

          <select name="bucket" defaultValue={currentFilters.bucket} className="legal-field">
            <option value="month">Monthly buckets</option>
            <option value="week">Weekly buckets</option>
          </select>

          <select name="rankingLimit" defaultValue={`${currentFilters.rankingLimit}`} className="legal-field">
            <option value="5">Top 5 rankings</option>
            <option value="10">Top 10 rankings</option>
            <option value="15">Top 15 rankings</option>
          </select>

          <div className="flex flex-col gap-3 sm:flex-row xl:col-span-3">
            <button type="submit" className="legal-button-primary w-full sm:w-auto">
              Apply Filters
            </button>
            <Link href="/reports" className="legal-button-secondary w-full sm:w-auto">
              Reset
            </Link>
          </div>
        </form>
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

      <section className="legal-panel p-5 md:p-6">
        <SectionHeader
          eyebrow="Summary Notes"
          description={`Narrative highlights generated from the current ${rangeLabel} / ${bucketLabel.toLowerCase()} view.`}
        />
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {data.summaryNotes.map((note) => (
            <div key={note} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-4 text-sm leading-7 text-slate-600">
              {note}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="User Growth"
            title="New users by bucket"
            description={`${bucketLabel} signup totals across the selected reporting range.`}
            actions={<DownloadActions csvHref={buildExportHref(currentFilters, "user_growth")} />}
          />
          <div className="mt-6">
            <TrendBars rows={data.userGrowth} valueKey="users" />
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Verification Throughput"
            title="Submitted, approved, rejected"
            description="Review volume and decision outcomes across the same filtered window."
            actions={<DownloadActions csvHref={buildExportHref(currentFilters, "verification")} />}
          />
          <div className="mt-6 overflow-x-auto">
            <table className="legal-table w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Bucket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Approved</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Rejected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.verificationThroughput.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 text-sm font-medium text-[#2F1D3B]">{row.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.submitted)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.approved)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.rejected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Content Creation"
            title="Discussions, answers, comments, cases"
            description={`Cross-surface publishing volume grouped into ${bucketLabel.toLowerCase()} buckets.`}
            actions={<DownloadActions csvHref={buildExportHref(currentFilters, "content")} />}
          />
          <div className="mt-6 overflow-x-auto">
            <table className="legal-table w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Bucket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Discussions</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Answers</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Comments</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.contentCreation.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 text-sm font-medium text-[#2F1D3B]">{row.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.discussions)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.answers)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.comments)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.cases)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Moderation Load"
            title="Reports, alerts, actions"
            description="Operational moderation volume across the same filtered reporting range."
            actions={<DownloadActions csvHref={buildExportHref(currentFilters, "moderation")} />}
          />
          <div className="mt-6 overflow-x-auto">
            <table className="legal-table w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Bucket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Reports</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Alerts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.moderationLoad.map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 text-sm font-medium text-[#2F1D3B]">{row.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.reports)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.alerts)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatNumber(row.actions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Queue Aging"
            description="Live operational backlog ages remain snapshot-based and are exportable separately."
          />
          <div className="mt-4 overflow-x-auto">
            <table className="legal-table w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Queue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Oldest age</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.queueAging.map((item) => (
                  <tr key={item.label}>
                    <td className="px-4 py-3 text-sm font-medium text-[#2F1D3B]">{item.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.value}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={item.href} className="font-semibold text-[#4C2F5E] hover:text-[#2F1D3B]">
                        View queue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Operational Anomalies"
            description="Comparisons are based on the current bucket mode so weekly and monthly views stay consistent."
          />
          <div className="mt-4 overflow-x-auto">
            <table className="legal-table w-full min-w-[620px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Signal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Comparison</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7F2]">
                {data.anomalies.map((item) => (
                  <tr key={item.label}>
                    <td className="px-4 py-3 text-sm font-medium text-[#2F1D3B]">{item.label}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.detail}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusPill status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Top Regions"
            description={`Top ${currentFilters.rankingLimit} published-case regions across the selected range.`}
          />
          <div className="mt-5">
            <TrendBars rows={data.rankings.regions} valueKey="count" />
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Top Courts"
            description={`Top ${currentFilters.rankingLimit} courts based on published-case volume.`}
          />
          <div className="mt-5">
            <TrendBars rows={data.rankings.courts} valueKey="count" tone="bg-[#735092]" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Top Categories"
            description={`Top ${currentFilters.rankingLimit} case categories within the filtered reporting range.`}
          />
          <div className="mt-5">
            <TrendBars rows={data.rankings.categories} valueKey="count" tone="bg-[#8C7A9B]" />
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <SectionHeader
            eyebrow="Top Tags By Engagement"
            description={`Top ${currentFilters.rankingLimit} tag engagement scores within the selected window.`}
          />
          <div className="mt-5">
            {data.rankings.tags.length ? (
              <TrendBars rows={data.rankings.tags} valueKey="score" tone="bg-[#A0606E]" />
            ) : (
              <div className="rounded-[18px] border border-dashed border-[#4C2F5E]/14 bg-[#FBF9FD] px-4 py-5 text-sm text-slate-500">
                Tag metric data has not been populated yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
