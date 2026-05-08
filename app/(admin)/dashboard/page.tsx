import { getAdminDashboardData } from "@/lib/services/admin.server";
import {
  AlertTriangle,
  BellRing,
  FileClock,
  FileSearch,
  Gavel,
  MessageSquareText,
  ShieldAlert,
  Users,
} from "lucide-react";
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

function prettyText(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function queueStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("infected") || normalized.includes("failed")) {
    return "bg-[#FCE8E6] text-[#A33A31]";
  }

  if (normalized.includes("pending") || normalized.includes("under review") || normalized.includes("open")) {
    return "bg-[#F6EBD6] text-[#8B642A]";
  }

  return "bg-[#EEF2F7] text-[#36506E]";
}

export default async function DashboardPage() {
  const data = await getAdminDashboardData();

  const kpiCards = [
    {
      title: "Users & Identity",
      icon: Users,
      href: "/user?status=ACTIVE",
      primary: `${formatNumber(data.kpis.users.total)} total users`,
      secondary: `${formatNumber(data.kpis.users.newToday)} new today`,
      detail: `${formatNumber(data.kpis.users.active7d)} active in 7d / ${formatNumber(data.kpis.users.suspended)} suspended`,
    },
    {
      title: "Lawyer Verification",
      icon: ShieldAlert,
      href: "/verification?status=PENDING",
      primary: `${formatNumber(data.kpis.verification.openRequests)} open requests`,
      secondary: `${formatNumber(data.kpis.verification.verifiedLawyers)} verified lawyers`,
      detail: `${formatNumber(data.kpis.verification.expiringSoon)} expiring soon / ${formatNumber(
        data.kpis.verification.rejectedRequests,
      )} rejected`,
    },
    {
      title: "Discussion Operations",
      icon: MessageSquareText,
      href: "/moderation?tab=reports&targetType=DISCUSSION",
      primary: `${formatNumber(data.kpis.discussions.createdToday)} new threads today`,
      secondary: `${formatNumber(data.kpis.discussions.unresolved)} unresolved`,
      detail: `${formatNumber(data.kpis.discussions.answersToday)} answers today / ${formatNumber(
        data.kpis.discussions.lockedOrHidden,
      )} locked or hidden`,
    },
    {
      title: "Case Repository",
      icon: Gavel,
      href: "/case-review?status=PENDING_REVIEW",
      primary: `${formatNumber(data.kpis.cases.pendingReview)} pending review`,
      secondary: `${formatNumber(data.kpis.cases.publishedToday)} published today`,
      detail:
        data.kpis.cases.averageApprovalHours === null
          ? `${formatNumber(data.kpis.cases.drafts)} drafts awaiting submission`
          : `${data.kpis.cases.averageApprovalHours}h average approval time`,
    },
    {
      title: "Moderation",
      icon: AlertTriangle,
      href: "/moderation?tab=alerts&severity=CRITICAL",
      primary: `${formatNumber(data.kpis.moderation.openReports)} open reports`,
      secondary: `${formatNumber(data.kpis.moderation.openAlerts)} open AI alerts`,
      detail: `${formatNumber(data.kpis.moderation.criticalAlerts)} critical alerts / ${formatNumber(
        data.kpis.moderation.contentHiddenOrRemoved,
      )} hidden or removed`,
    },
    {
      title: "Files & Scan Health",
      icon: FileClock,
      href: "/files?scanStatus=FAILED",
      primary: `${formatNumber(data.kpis.files.pendingScan)} pending scans`,
      secondary: `${formatNumber(data.kpis.files.infected)} infected files`,
      detail: `${formatNumber(data.kpis.files.failed)} failed scans / ${formatNumber(
        data.kpis.files.uploadedToday,
      )} uploaded today`,
    },
    {
      title: "Notifications",
      icon: BellRing,
      href: "/notifications?type=SYSTEM",
      primary: `${formatNumber(data.kpis.notifications.generatedToday)} created today`,
      secondary: `${formatNumber(data.kpis.notifications.unreadSystemNotices)} unread system notices`,
      detail: "Delivery history is still an add-on subsystem.",
    },
    {
      title: "Security & Audit",
      icon: FileSearch,
      href: "/settings?failedOnly=1&privilegedOnly=1",
      primary: `${formatNumber(data.kpis.security.failedLogins24h)} failed logins in 24h`,
      secondary: `${formatNumber(data.kpis.security.activePrivilegedSessions)} privileged sessions`,
      detail: `${formatNumber(data.kpis.security.lockedCredentials)} locked credentials / ${formatNumber(
        data.kpis.security.auditEvents24h,
      )} audit events in 24h`,
    },
  ];

  const queueSections = [
    {
      title: "Case Review Queue",
      href: "/case-review?status=PENDING_REVIEW",
      total: data.queues.caseReview.total,
      items: data.queues.caseReview.items,
    },
    {
      title: "Lawyer Verification Queue",
      href: "/verification?status=PENDING",
      total: data.queues.verification.total,
      items: data.queues.verification.items,
    },
    {
      title: "Reports Queue",
      href: "/moderation?tab=reports",
      total: data.queues.reports.total,
      items: data.queues.reports.items,
    },
    {
      title: "AI Alert Queue",
      href: "/moderation?tab=alerts",
      total: data.queues.aiAlerts.total,
      items: data.queues.aiAlerts.items,
    },
    {
      title: "Security Watchlist",
      href: "/settings?failedOnly=1&privilegedOnly=1",
      total: data.queues.security.total,
      items: data.queues.security.items,
    },
    {
      title: "File Exceptions",
      href: "/files?scanStatus=FAILED",
      total: data.queues.fileExceptions.total,
      items: data.queues.fileExceptions.items,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Super Admin Command Center</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Platform health, queues, and risk signals in one control surface.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              All cards and queues on this page are sourced from current database records across identity, review,
              moderation, files, notifications, and security activity.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Last refresh</p>
            <p className="mt-2 text-base font-semibold text-[#2F1D3B]">{formatTimestamp(data.generatedAt)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link key={card.title} href={card.href} className="legal-panel lh-transition-link p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{card.title}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{card.primary}</p>
                  <p className="mt-1 text-sm font-medium text-[#4C2F5E]">{card.secondary}</p>
                </div>
                <div className="rounded-[18px] bg-[#F4EFF8] p-3 text-[#4C2F5E]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{card.detail}</p>
            </Link>
          );
        })}
      </section>

      <section className="space-y-6">
        <div className="legal-panel p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Operational Queues</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">
                Triage by backlog age, not guesswork.
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {queueSections.map((section) => (
              <div key={section.title} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-[#2F1D3B]">{section.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{formatNumber(section.total)} items currently open</p>
                  </div>
                  <Link href={section.href} className="text-sm font-semibold text-[#4C2F5E] hover:text-[#2F1D3B]">
                    Open
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {section.items.length ? (
                    section.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block rounded-[18px] border border-[#4C2F5E]/10 bg-white px-4 py-3 transition hover:border-[#4C2F5E]/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold leading-6 text-[#2F1D3B]">{item.title}</p>
                          <span className="shrink-0 text-xs font-medium text-slate-500">{item.ageLabel}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${queueStatusClasses(item.status)}`}>
                            {prettyText(item.status)}
                          </span>
                          <span className="text-xs text-slate-500">{item.meta}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[#4C2F5E]/14 bg-white px-4 py-5 text-sm text-slate-500">
                      No items are waiting in this queue.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="legal-panel p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Most Viewed Cases</p>
            <div className="mt-4 space-y-3">
              {data.insights.mostViewedCases.length ? (
                data.insights.mostViewedCases.map((item) => (
                  <Link
                    key={item.id}
                    href={`/cases/${item.slug}`}
                    className="block rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-3 transition hover:border-[#4C2F5E]/18"
                  >
                    <p className="text-sm font-semibold text-[#2F1D3B]">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatNumber(item.viewCount)} views / {formatNumber(item.followerCount)} follows / {formatNumber(
                        item.bookmarkCount,
                      )} bookmarks
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No case view data is available from the database yet.</p>
              )}
            </div>
          </section>

          <section className="legal-panel p-5 md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Top Tags</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.insights.topTags.length ? (
                data.insights.topTags.map((tag) => (
                  <div
                    key={tag.tagId}
                    className="rounded-full border border-[#4C2F5E]/12 bg-[#FBF9FD] px-3 py-2 text-sm text-[#4C2F5E]"
                  >
                    {tag.name} / {formatNumber(tag.totalLinks)}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No tag activity is available from the database yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
