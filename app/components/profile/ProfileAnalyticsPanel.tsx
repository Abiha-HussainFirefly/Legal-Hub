import {
  Activity,
  Award,
  BarChart3,
  CalendarRange,
  Eye,
  MessageSquareText,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ProfileAnalyticsSummary, ProfileHeatmapDay } from "@/types/profile";
import ProfileActivityHeatmap from "@/app/components/profile/ProfileActivityHeatmap";

const metricConfig = [
  {
    key: "discussions",
    label: "Discussions",
    icon: MessageSquareText,
  },
  {
    key: "answers",
    label: "Answers",
    icon: MessageCircleMore,
  },
  {
    key: "comments",
    label: "Comments",
    icon: Activity,
  },
  {
    key: "cases",
    label: "Cases",
    icon: BarChart3,
  },
  {
    key: "acceptedAnswers",
    label: "Accepted",
    icon: ShieldCheck,
  },
  {
    key: "followers",
    label: "Followers",
    icon: Users,
  },
  {
    key: "reactionsReceived",
    label: "Reactions",
    icon: Sparkles,
  },
  {
    key: "profileViews",
    label: "Profile views",
    icon: Eye,
  },
  {
    key: "badges",
    label: "Badges",
    icon: Award,
  },
  {
    key: "points",
    label: "Points",
    icon: Star,
  },
] as const;

export default function ProfileAnalyticsPanel({
  analytics,
  heatmap,
}: {
  analytics: ProfileAnalyticsSummary;
  heatmap: ProfileHeatmapDay[];
}) {
  const featuredMetrics = [
    {
      label: "Visibility",
      value: analytics.profileViews.toLocaleString(),
      helper: "Profile views",
      icon: Eye,
    },
    {
      label: "Engagement",
      value: analytics.reactionsReceived.toLocaleString(),
      helper: "Reactions received",
      icon: Sparkles,
    },
    {
      label: "Authority",
      value: analytics.acceptedAnswers.toLocaleString(),
      helper: "Accepted answers",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-5 shadow-[var(--shadow-card)] md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(76,47,94,0.10),rgba(141,116,163,0.04))] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Engagement Analytics
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--heading)]">
              Platform contribution and visibility
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              A combined view of profile reach, contribution consistency, and community response
              across discussions, answers, comments, and case work.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {featuredMetrics.map(({ label, value, helper, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        {label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--heading)]">
                        {value}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{helper}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--background-card-nested)] text-[var(--primary)]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-[var(--foreground)] sm:grid-cols-2">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Posting Rate
              </p>
              <p className="mt-2 font-medium text-[var(--heading)]">
                {analytics.postingRateLabel}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Momentum
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-medium text-[var(--heading)]">
                <TrendingUp className="h-4 w-4 text-[var(--primary)]" />
                {analytics.trendLabel}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Community Level
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-medium text-[var(--heading)]">
                <Star className="h-4 w-4 text-[var(--primary)]" />
                Level {analytics.level}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Contribution Window
              </p>
              <p className="mt-2 inline-flex items-center gap-2 font-medium text-[var(--heading)]">
                <CalendarRange className="h-4 w-4 text-[var(--primary)]" />
                Last 12 months
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metricConfig.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--heading)]">
                    {analytics[key].toLocaleString()}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--background-surface)] text-[var(--primary)]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {heatmap.length > 0 ? <ProfileActivityHeatmap days={heatmap} /> : null}
    </section>
  );
}
