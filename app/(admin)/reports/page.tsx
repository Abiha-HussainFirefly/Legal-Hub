import { getAdminReportsData } from "@/lib/services/admin.server";
import { AlertTriangle, BarChart3, Gavel, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";

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

export default async function ReportsPage() {
  const data = await getAdminReportsData();

  const summaryCards = [
    {
      title: "New Users 30d",
      value: formatNumber(data.summary.newUsers30d),
      detail: "Accounts created across the last 30 days",
      icon: Users,
    },
    {
      title: "Published Cases 30d",
      value: formatNumber(data.summary.publishedCases30d),
      detail: "Repository items that reached published state",
      icon: Gavel,
    },
    {
      title: "Open Moderation Signals",
      value: formatNumber(data.summary.openModerationSignals),
      detail: "Open reports plus acknowledged/open AI alerts",
      icon: ShieldAlert,
    },
    {
      title: "Verification Approval Rate",
      value: data.summary.verificationApprovalRate30d === null ? "N/A" : `${data.summary.verificationApprovalRate30d}%`,
      detail: "Decided lawyer verification requests in the last 30 days",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Analytics & Reports</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Platform analytics now come from the live schema.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page shows real user growth, content throughput, verification, moderation, queue-aging,
              and operational anomaly summaries built from Prisma-backed records.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Last refresh</p>
            <p className="mt-2 text-base font-semibold text-[#2F1D3B]">{formatTimestamp(data.generatedAt)}</p>
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

      <section className="legal-panel p-5 md:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Summary Notes</p>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">User Growth</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">New users by month</h2>
          <div className="mt-6">
            <TrendBars rows={data.userGrowth} valueKey="users" />
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Verification Throughput</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">Submitted, approved, rejected</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="legal-table w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Month</th>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Content Creation</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">Discussions, answers, comments, cases</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="legal-table w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Month</th>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Moderation Load</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">Reports, alerts, actions</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="legal-table w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Month</th>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Queue Aging</p>
          <div className="mt-4 space-y-3">
            {data.queueAging.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-4 rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-3 transition hover:border-[#4C2F5E]/20"
              >
                <span className="text-sm font-medium text-[#2F1D3B]">{item.label}</span>
                <span className="text-sm font-semibold text-[#4C2F5E]">{item.value}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Operational Anomalies</p>
          <div className="mt-4 space-y-3">
            {data.anomalies.map((item) => (
              <div key={item.label} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#2F1D3B]">{item.label}</p>
                  <StatusPill status={item.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="legal-panel p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Top Regions</p>
          <div className="mt-5">
            <TrendBars rows={data.rankings.regions} valueKey="count" />
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Top Courts</p>
          <div className="mt-5">
            <TrendBars rows={data.rankings.courts} valueKey="count" tone="bg-[#735092]" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="legal-panel p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Top Categories</p>
          <div className="mt-5">
            <TrendBars rows={data.rankings.categories} valueKey="count" tone="bg-[#8C7A9B]" />
          </div>
        </div>

        <div className="legal-panel p-5 md:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Top Tags By Engagement</p>
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

      <section className="legal-panel p-5 md:p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#4C2F5E]" />
          <p className="text-sm text-slate-600">
            Export workflows and scheduled reports are still pending. This page currently focuses on live, read-only platform analytics.
          </p>
        </div>
      </section>
    </div>
  );
}
