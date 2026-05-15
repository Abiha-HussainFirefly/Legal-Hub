'use client';

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type BreakdownItem = {
  status: string;
  total: number;
};

type SparklinePoint = {
  label: string;
  value: number;
};

type AdminDashboardChartsProps = {
  data: {
    filters: {
      rangeDays: number;
      bucket: 'day' | 'week' | 'month';
    };
    kpis: {
      users: {
        total: number;
        newToday: number;
        active7d: number;
        active30d: number;
      };
      verification: {
        openRequests: number;
      };
      discussions: {
        createdToday: number;
        answersToday: number;
        commentsToday: number;
      };
      cases: {
        pendingReview: number;
        publishedToday: number;
        averageApprovalHours: number | null;
      };
      moderation: {
        openReports: number;
        openAlerts: number;
        criticalAlerts: number;
      };
      files: {
        pendingScan: number;
      };
      notifications: {
        unreadSystemNotices: number;
      };
      security: {
        failedLogins24h: number;
      };
    };
    charts: {
      userActivityBreakdown: Array<{
        label: string;
        total: number;
      }>;
      activityTimeline: Array<{
        dateKey: string;
        dateLabel: string;
        newUsers: number;
        discussions: number;
        answers: number;
        comments: number;
        caseSubmissions: number;
        casePublished: number;
        notifications: number;
      }>;
      riskTimeline: Array<{
        dateKey: string;
        dateLabel: string;
        reports: number;
        alerts: number;
        failedLogins: number;
        fileUploads: number;
      }>;
      caseReviewTimeline: Array<{
        dateKey: string;
        dateLabel: string;
        submitted: number;
        published: number;
        rejected: number;
      }>;
      caseStatusBreakdown: BreakdownItem[];
      discussionStatusBreakdown: BreakdownItem[];
      discussionContentBreakdown: BreakdownItem[];
    };
    insights: {
      mostViewedCases: Array<{
        id: string;
        title: string;
        viewCount: number;
      }>;
      topTags: Array<{
        tagId: string;
        name: string;
        totalLinks: number;
      }>;
    };
  };
};

const CASE_STATUS_ORDER = ['PUBLISHED', 'PENDING_REVIEW', 'DRAFT', 'REJECTED', 'ARCHIVED', 'REMOVED'];
const DISCUSSION_STATUS_ORDER = ['OPEN', 'RESOLVED', 'CLOSED', 'LOCKED', 'HIDDEN', 'DELETED'];
const CONTENT_STATUS_ORDER = ['ACTIVE', 'PENDING_MODERATION', 'FLAGGED', 'HIDDEN', 'REMOVED', 'DELETED', 'DRAFT'];
const PIE_COLORS = ['#1F4566', '#C79343', '#6E3B2C', '#5F6F52', '#7D89A3', '#C65D48'];
const CHART_GRID_STROKE = 'var(--border-subtle)';
const CHART_TICK_FILL = 'var(--text-muted)';
const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--background-surface)',
  color: 'var(--foreground)',
  borderRadius: '14px',
  border: '1px solid var(--border-subtle)',
  boxShadow: 'var(--shadow-card)',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function prettyLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function truncateLabel(value: string, limit = 18) {
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value;
}

function sumSeries(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getSeriesDelta(values: number[]) {
  if (values.length < 2) return null;
  return values[values.length - 1] - values[values.length - 2];
}

function formatDeltaLabel(delta: number | null) {
  if (delta === null) return 'No prior bucket';
  if (delta === 0) return 'Flat vs previous bucket';

  return `${delta > 0 ? '+' : '-'}${formatNumber(Math.abs(delta))} vs previous bucket`;
}

function sortBreakdown(items: BreakdownItem[], order: string[]) {
  const orderMap = new Map(order.map((status, index) => [status, index]));

  return [...items].sort((left, right) => {
    const leftIndex = orderMap.get(left.status) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.get(right.status) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex || right.total - left.total;
  });
}

function ChartCard({
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,var(--background-surface)_0%,var(--background-card-nested)_100%)] p-5 shadow-[var(--shadow-elevated)] md:p-6 ${className}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{eyebrow}</p>
      <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--heading)]">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MetricTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[linear-gradient(135deg,var(--background-surface),var(--background-card-nested))] p-4 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--heading)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}

function SparklineMetricCard({
  eyebrow,
  title,
  value,
  detail,
  deltaLabel,
  data,
  color,
  gradientId,
}: {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  deltaLabel: string;
  data: SparklinePoint[];
  color: string;
  gradientId: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{eyebrow}</p>
          <h4 className="mt-2 text-base font-semibold tracking-[-0.03em] text-[var(--heading)]">{title}</h4>
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ backgroundColor: `${color}14`, color }}
        >
          {deltaLabel}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold tracking-[-0.05em] text-[var(--heading)]">{value}</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{detail}</p>
        </div>
      </div>

      <div className="mt-4 h-[96px]">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Tooltip
                formatter={(pointValue) => formatNumber(Number(pointValue ?? 0))}
                labelFormatter={(label) => `Period: ${String(label)}`}
                contentStyle={CHART_TOOLTIP_STYLE}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={`url(#${gradientId})`}
                strokeWidth={2.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[18px] border border-dashed border-[var(--border-subtle)] bg-[var(--background-card-nested)] text-sm text-[var(--text-muted)]">
            No trend data yet
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-[22px] border border-dashed border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-6 text-center text-sm text-[var(--text-muted)]">
      {message}
    </div>
  );
}

export default function AdminDashboardCharts({ data }: AdminDashboardChartsProps) {
  const rangeLabel = `${data.filters.rangeDays}d`;
  const bucketLabel = data.filters.bucket === 'day' ? 'Daily' : data.filters.bucket === 'week' ? 'Weekly' : 'Monthly';
  const caseStatusData = sortBreakdown(data.charts.caseStatusBreakdown, CASE_STATUS_ORDER);
  const discussionStatusData = sortBreakdown(data.charts.discussionStatusBreakdown, DISCUSSION_STATUS_ORDER);
  const discussionContentData = sortBreakdown(data.charts.discussionContentBreakdown, CONTENT_STATUS_ORDER);
  const userActivityData = data.charts.userActivityBreakdown;
  const activeUsers = userActivityData.find((item) => item.label === 'Active 30d')?.total ?? 0;
  const inactiveUsers = userActivityData.find((item) => item.label === 'Inactive')?.total ?? 0;
  const mostViewedCasesData = data.insights.mostViewedCases.slice(0, 5).map((item) => ({
    name: truncateLabel(item.title, 24),
    views: item.viewCount,
  }));
  const topTagsData = data.insights.topTags.slice(0, 6).map((item) => ({
    name: truncateLabel(item.name, 18),
    links: item.totalLinks,
  }));

  
  const activityTimeline = data.charts.activityTimeline.map((item) => ({
    DateLabel: item.dateLabel,
    DateKey: item.dateKey,
    NewUsers: item.newUsers,
    Discussions: item.discussions,
    Answers: item.answers,
    Comments: item.comments,
    CaseSubmissions: item.caseSubmissions,
    CasePublished: item.casePublished,
    Notifications: item.notifications,
  }));

  const riskTimeline = data.charts.riskTimeline.map((item) => ({
    DateLabel: item.dateLabel,
    DateKey: item.dateKey,
    Reports: item.reports,
    Alerts: item.alerts,
    FailedLogins: item.failedLogins,
    FileUploads: item.fileUploads,
  }));

  const caseReviewTimeline = data.charts.caseReviewTimeline.map((item) => ({
    DateLabel: item.dateLabel,
    DateKey: item.dateKey,
    Submitted: item.submitted,
    Published: item.published,
    Rejected: item.rejected,
  }));

  const signupSparkline = activityTimeline.map((item) => ({
    label: item.DateLabel,
    value: item.NewUsers,
  }));
  const moderationSparkline = riskTimeline.map((item) => ({
    label: item.DateLabel,
    value: item.Reports + item.Alerts + item.FailedLogins,
  }));
  const publishedSparkline = caseReviewTimeline.map((item) => ({
    label: item.DateLabel,
    value: item.Published,
  }));
  const executiveOverviewData = activityTimeline.map((item, index) => ({
    DateLabel: item.DateLabel,
    ActivityLoad: item.Discussions + item.Answers + item.Comments + item.Notifications,
    ReviewFlow: item.CaseSubmissions + item.CasePublished,
    RiskLoad:
      (riskTimeline[index]?.Reports ?? 0) +
      (riskTimeline[index]?.Alerts ?? 0) +
      (riskTimeline[index]?.FailedLogins ?? 0),
  }));

  const totalNewUsers = sumSeries(signupSparkline.map((item) => item.value));
  const totalModerationSignals = sumSeries(moderationSparkline.map((item) => item.value));
  const totalPublishedCases = sumSeries(publishedSparkline.map((item) => item.value));
  const totalActivityLoad = sumSeries(executiveOverviewData.map((item) => item.ActivityLoad));
  const totalReviewFlow = sumSeries(executiveOverviewData.map((item) => item.ReviewFlow));
  const totalRiskLoad = sumSeries(executiveOverviewData.map((item) => item.RiskLoad));

  return (
    <section className="space-y-6">
      <ChartCard
        eyebrow="Live Admin Analytics"
        title="Main dashboard controls and live KPI signals"
        subtitle="Switch the time window here, then read live KPI movement, active versus inactive users, and the admin workload trend from the same filtered state."
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)]">Current view</p>
            <p className="mt-1 text-lg font-semibold text-[var(--heading)]">
              {rangeLabel} / {bucketLabel}
            </p>
          </div>

          <form className="grid gap-3 sm:grid-cols-[180px_180px_auto]">
            <select name="range" defaultValue={`${data.filters.rangeDays}`} className="legal-field">
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 1 year</option>
            </select>
            <select name="bucket" defaultValue={data.filters.bucket} className="legal-field">
              <option value="day">By day</option>
              <option value="week">By week</option>
              <option value="month">By month</option>
            </select>
            <button type="submit" className="legal-button-primary whitespace-nowrap px-5">
              Apply Filter
            </button>
          </form>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="User Pulse"
            value={formatNumber(data.kpis.users.active7d)}
            detail={`${formatNumber(data.kpis.users.active30d)} active in 30 days`}
          />
          <MetricTile
            label="Review Queue"
            value={formatNumber(data.kpis.cases.pendingReview + data.kpis.verification.openRequests)}
            detail={`${formatNumber(data.kpis.cases.pendingReview)} cases + ${formatNumber(data.kpis.verification.openRequests)} verifications`}
          />
          <MetricTile
            label="Moderation Heat"
            value={formatNumber(data.kpis.moderation.openReports + data.kpis.moderation.openAlerts)}
            detail={`${formatNumber(data.kpis.moderation.criticalAlerts)} critical alerts open`}
          />
          <MetricTile
            label="Security Watch"
            value={formatNumber(data.kpis.security.failedLogins24h)}
            detail={`${formatNumber(data.kpis.files.pendingScan)} pending scans / ${formatNumber(data.kpis.notifications.unreadSystemNotices)} unread notices`}
          />
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <SparklineMetricCard
            eyebrow="Range Signups"
            title="New users added"
            value={formatNumber(totalNewUsers)}
            detail={`${formatNumber(data.kpis.users.newToday)} joined today`}
            deltaLabel={formatDeltaLabel(getSeriesDelta(signupSparkline.map((item) => item.value)))}
            data={signupSparkline}
            color="#1F4566"
            gradientId="dashboardSignupsSparkline"
          />
          <SparklineMetricCard
            eyebrow="Risk Pressure"
            title="Reports, alerts, and failed logins"
            value={formatNumber(totalModerationSignals)}
            detail={`${formatNumber(data.kpis.moderation.criticalAlerts)} critical alerts still open`}
            deltaLabel={formatDeltaLabel(getSeriesDelta(moderationSparkline.map((item) => item.value)))}
            data={moderationSparkline}
            color="#C65D48"
            gradientId="dashboardModerationSparkline"
          />
          <SparklineMetricCard
            eyebrow="Repository Output"
            title="Cases published"
            value={formatNumber(totalPublishedCases)}
            detail={`${formatNumber(data.kpis.cases.publishedToday)} published today`}
            deltaLabel={formatDeltaLabel(getSeriesDelta(publishedSparkline.map((item) => item.value)))}
            data={publishedSparkline}
            color="#1F7A5A"
            gradientId="dashboardPublishedSparkline"
          />
        </div>

        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Executive Overview</p>
                <h4 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--heading)]">Operational load versus risk load</h4>
                <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                  Bars show the total admin-visible activity moving through the platform. The line tracks reports, alerts,
                  and failed logins in the same periods.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-[#EAF0F5] px-3 py-1 text-[#1F4566]">
                  Activity {formatNumber(totalActivityLoad)}
                </span>
                <span className="rounded-full bg-[#F2F6F0] px-3 py-1 text-[#1F7A5A]">
                  Review flow {formatNumber(totalReviewFlow)}
                </span>
                <span className="rounded-full bg-[#FCEDEA] px-3 py-1 text-[#C65D48]">
                  Risk {formatNumber(totalRiskLoad)}
                </span>
              </div>
            </div>

            <div className="mt-5 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={executiveOverviewData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="DateLabel" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="activity"
                    tick={{ fill: CHART_TICK_FILL, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <YAxis
                    yAxisId="risk"
                    orientation="right"
                    tick={{ fill: CHART_TICK_FILL, fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar yAxisId="activity" dataKey="ActivityLoad" fill="#4FD1D9" radius={[10, 10, 0, 0]} />
                  <Line yAxisId="risk" type="monotone" dataKey="RiskLoad" stroke="#1F4566" strokeWidth={3} dot={false} />
                  <Line yAxisId="activity" type="monotone" dataKey="ReviewFlow" stroke="#1F7A5A" strokeWidth={2.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4 md:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">User Activity</p>
            <h4 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--heading)]">Active vs inactive users</h4>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Active users are based on logins in the last 30 days.</p>

            {userActivityData.length ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userActivityData}
                        dataKey="total"
                        nameKey="label"
                        innerRadius={62}
                        outerRadius={98}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {userActivityData.map((item, index) => (
                          <Cell key={item.label} fill={index === 0 ? '#1F4566' : '#D6DEE8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatNumber(Number(value ?? 0))}
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7C92]">Active 30d</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--heading)]">{formatNumber(activeUsers)}</p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Inactive</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--heading)]">{formatNumber(inactiveUsers)}</p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6432]">Total Users</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--heading)]">{formatNumber(data.kpis.users.total)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyChartState message="User activity data is not available yet." />
            )}
          </div>
        </div>
      </ChartCard>

      <div className="grid gap-6 2xl:grid-cols-[1.45fr_1fr]">
        <ChartCard
          eyebrow="Platform Pulse"
          title={`${rangeLabel} creation trend`}
          subtitle={`New users, discussions, and repository submissions moving through the platform ${bucketLabel.toLowerCase()} across the selected window.`}
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTimeline} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminsNewUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F4566" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#1F4566" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="adminsDiscussions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C79343" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#C79343" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="adminsCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6E3B2C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6E3B2C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="DateLabel" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: CHART_TICK_FILL, fontSize: 12 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="NewUsers" stroke="#1F4566" fill="url(#adminsNewUsers)" strokeWidth={2.5} />
                <Area
                  type="monotone"
                  dataKey="Discussions"
                  stroke="#C79343"
                  fill="url(#adminsDiscussions)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  dataKey="CaseSubmissions"
                  stroke="#6E3B2C"
                  fill="url(#adminsCases)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Repository Flow"
          title="Case review throughput"
          subtitle={`What is being submitted, published, and rejected across the repository ${bucketLabel.toLowerCase()} in the selected window.`}
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={caseReviewTimeline} margin={{ top: 8, right: 10, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="DateLabel" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: CHART_TICK_FILL, fontSize: 12 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="Submitted" radius={[10, 10, 0, 0]} fill="#E7D7BE" />
                <Line type="monotone" dataKey="Published" stroke="#1F7A5A" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Rejected" stroke="#C65D48" strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-[var(--text-muted)]">
            <span className="rounded-full bg-[#F5EBDD] px-3 py-1 text-[#8A6432]">Submitted</span>
            <span className="rounded-full bg-[#E7F4ED] px-3 py-1 text-[#1F7A5A]">Published</span>
            <span className="rounded-full bg-[#FBE8E3] px-3 py-1 text-[#B44D39]">Rejected</span>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          eyebrow="Discussion Engine"
          title="Discussion throughput"
          subtitle={`A live view of how many discussions, answers, and comments the platform is generating ${bucketLabel.toLowerCase()} in the selected range.`}
        >
          <div className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityTimeline} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="DateLabel" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: CHART_TICK_FILL, fontSize: 12 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="Discussions" stackId="discussion" fill="#1F4566" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Answers" stackId="discussion" fill="#C79343" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Comments" stackId="discussion" fill="#7D89A3" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="Risk Radar"
          title="Reports, alerts, and failed logins"
          subtitle={`Moderation and security signal volume ${bucketLabel.toLowerCase()} across the selected window, with file uploads shown as operational load.`}
        >
          <div className="h-[310px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={riskTimeline} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                <XAxis dataKey="DateLabel" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: CHART_TICK_FILL, fontSize: 12 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="Reports" fill="#C65D48" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Alerts" fill="#D88D32" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="FailedLogins" stroke="#102033" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="FileUploads" stroke="#6B8B60" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_1.2fr]">
        <ChartCard
          eyebrow="Repository Inventory"
          title="Current case repository mix"
          subtitle="The current balance between draft, pending, published, rejected, archived, and removed records."
        >
          {caseStatusData.length ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caseStatusData}
                      dataKey="total"
                      nameKey="status"
                      innerRadius={74}
                      outerRadius={110}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {caseStatusData.map((item, index) => (
                        <Cell key={item.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatNumber(Number(value ?? 0))}
                      labelFormatter={(label) => prettyLabel(String(label))}
                      contentStyle={CHART_TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {caseStatusData.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-sm font-medium text-[var(--heading)]">{prettyLabel(item.status)}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600">{formatNumber(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChartState message="Case repository distribution data is not available yet." />
          )}
        </ChartCard>

        <ChartCard
          eyebrow="Discussion Health"
          title="Thread status and moderation state"
          subtitle="Discussion lifecycle status on one side and content moderation state on the other."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-semibold text-[var(--heading)]">Thread status</p>
              {discussionStatusData.length ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discussionStatusData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid stroke={CHART_GRID_STROKE} horizontal={false} />
                      <XAxis type="number" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="status"
                        width={88}
                        tickFormatter={prettyLabel}
                        tick={{ fill: CHART_TICK_FILL, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => formatNumber(Number(value ?? 0))}
                        labelFormatter={(label) => prettyLabel(String(label))}
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                      <Bar dataKey="total" fill="#1F4566" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartState message="Discussion status data is not available yet." />
              )}
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold text-[var(--heading)]">Content moderation state</p>
              {discussionContentData.length ? (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discussionContentData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid stroke={CHART_GRID_STROKE} horizontal={false} />
                      <XAxis type="number" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="status"
                        width={128}
                        tickFormatter={prettyLabel}
                        tick={{ fill: CHART_TICK_FILL, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => formatNumber(Number(value ?? 0))}
                        labelFormatter={(label) => prettyLabel(String(label))}
                        contentStyle={CHART_TOOLTIP_STYLE}
                      />
                      <Bar dataKey="total" fill="#C79343" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChartState message="Discussion moderation data is not available yet." />
              )}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          eyebrow="Case Interest"
          title="Most viewed repository entries"
          subtitle="The published case records receiving the most attention right now."
        >
          {mostViewedCasesData.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostViewedCasesData} layout="vertical" margin={{ top: 0, right: 12, left: 10, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} horizontal={false} />
                  <XAxis type="number" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fill: CHART_TICK_FILL, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${formatNumber(Number(value ?? 0))} views`, 'Views']}
                    contentStyle={CHART_TOOLTIP_STYLE}
                  />
                  <Bar dataKey="views" fill="#6E3B2C" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="Case engagement data is not available yet." />
          )}
        </ChartCard>

        <ChartCard
          eyebrow="Taxonomy Signals"
          title="Top tags in active circulation"
          subtitle="Which tags are appearing most frequently across discussions and case records."
        >
          {topTagsData.length ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTagsData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: CHART_TICK_FILL, fontSize: 11 }} tickLine={false} axisLine={false} width={34} />
                  <Tooltip
                    formatter={(value) => [formatNumber(Number(value ?? 0)), 'Links']}
                    contentStyle={CHART_TOOLTIP_STYLE}
                  />
                  <Bar dataKey="links" radius={[10, 10, 0, 0]}>
                    {topTagsData.map((item, index) => (
                      <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="Tag activity data is not available yet." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricTile
          label="Discussions Today"
          value={formatNumber(data.kpis.discussions.createdToday)}
          detail={`${formatNumber(data.kpis.discussions.answersToday)} answers / ${formatNumber(data.kpis.discussions.commentsToday)} comments`}
        />
        <MetricTile
          label="Cases Published Today"
          value={formatNumber(data.kpis.cases.publishedToday)}
          detail={
            data.kpis.cases.averageApprovalHours === null
              ? 'Approval timing will appear after recent reviews are available'
              : `${data.kpis.cases.averageApprovalHours}h average approval time`
          }
        />
        <MetricTile
          label="Open Reports + Alerts"
          value={formatNumber(data.kpis.moderation.openReports + data.kpis.moderation.openAlerts)}
          detail={`${formatNumber(data.kpis.security.failedLogins24h)} failed logins in the last 24h`}
        />
        <MetricTile
          label="New Users Today"
          value={formatNumber(data.kpis.users.newToday)}
          detail={`${formatNumber(activeUsers)} active and ${formatNumber(inactiveUsers)} inactive users`}
        />
      </div>
    </section>
  );
}
