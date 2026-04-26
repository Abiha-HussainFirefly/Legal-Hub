import AnimatedLink from "@/app/components/ui/animated-link";
import ProfileAnalyticsPanel from "@/app/components/profile/ProfileAnalyticsPanel";
import type { ProfessionalProfile } from "@/types/profile";
import {
  Award,
  BarChart3,
  Clock3,
  Eye,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

function formatLongDate(value?: string | null) {
  if (!value) return "Not available yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function MetricCard({
  label,
  value,
  helper,
  icon,
  className = "",
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`workspace-sidebar p-5 lh-page-enter lh-surface-lift ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{value}</p>
          <p className="mt-2 text-sm text-[#736683]">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OwnerProfileStatsView({ profile }: { profile: ProfessionalProfile }) {
  const { analytics } = profile;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Community level"
          value={`Level ${analytics.level}`}
          helper="Current platform level based on sustained contributions."
          icon={<Star className="h-5 w-5" />}
          className="lh-delay-1"
        />
        <MetricCard
          label="Points"
          value={analytics.points.toLocaleString()}
          helper="Accumulated participation and contribution points."
          icon={<Sparkles className="h-5 w-5" />}
          className="lh-delay-2"
        />
        <MetricCard
          label="Profile views"
          value={analytics.profileViews.toLocaleString()}
          helper="How often members and visitors opened your profile."
          icon={<Eye className="h-5 w-5" />}
          className="lh-delay-2"
        />
        <MetricCard
          label="Accepted answers"
          value={analytics.acceptedAnswers.toLocaleString()}
          helper="Answers marked as trusted or most useful."
          icon={<ShieldCheck className="h-5 w-5" />}
          className="lh-delay-3"
        />
      </div>

      <div className="lh-page-enter lh-delay-1">
        <ProfileAnalyticsPanel analytics={profile.analytics} heatmap={profile.heatmap} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="workspace-sidebar p-5 lh-page-enter lh-delay-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2F1D3B]">Recent contributions</h2>
              <p className="mt-1 text-sm leading-7 text-[#736683]">
                Your latest visible activity across discussions, answers, and case work.
              </p>
            </div>
          </div>

          {profile.recentContributions.length > 0 ? (
            <div className="mt-5 space-y-3">
              {profile.recentContributions.map((item) => (
                <AnimatedLink
                  key={item.id}
                  href={item.href}
                  className="block rounded-[18px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-4 transition hover:border-[#4C2F5E]/16 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="workspace-pill border-[#4C2F5E]/10 bg-white text-[#4C2F5E]">
                      {item.kind}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                      {formatLongDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-[#2F1D3B]">{item.title}</p>
                  {item.detail ? <p className="mt-2 text-sm leading-7 text-[#736683]">{item.detail}</p> : null}
                  {item.metricLabel ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                      {item.metricLabel}
                    </p>
                  ) : null}
                </AnimatedLink>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[18px] border border-dashed border-[#4C2F5E]/12 bg-[#FBF9FD] px-4 py-5 text-sm text-[#736683]">
              No recent visible contributions yet.
            </div>
          )}
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section className="workspace-sidebar p-5 lh-page-enter lh-delay-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Performance snapshot</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Momentum</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#2F1D3B]">
                  <TrendingUp className="h-4 w-4 text-[#4C2F5E]" />
                  {analytics.trendLabel}
                </p>
              </div>
              <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Posting rate</p>
                <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{analytics.postingRateLabel}</p>
              </div>
              <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Last contribution</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#2F1D3B]">
                  <Clock3 className="h-4 w-4 text-[#4C2F5E]" />
                  {formatLongDate(analytics.lastContributionAt)}
                </p>
              </div>
              <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Followers</p>
                <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{analytics.followers.toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className="workspace-sidebar p-5 lh-page-enter lh-delay-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#2F1D3B]">Recognition</h2>
                <p className="mt-1 text-sm leading-7 text-[#736683]">Badges and trust signals tied to platform participation.</p>
              </div>
            </div>

            {profile.badges.length > 0 ? (
              <div className="mt-5 space-y-3">
                {profile.badges.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-4">
                    <p className="text-base font-semibold text-[#2F1D3B]">{item.name}</p>
                    {item.description ? <p className="mt-2 text-sm leading-7 text-[#736683]">{item.description}</p> : null}
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                      Awarded {formatLongDate(item.awardedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[18px] border border-dashed border-[#4C2F5E]/12 bg-[#FBF9FD] px-4 py-5 text-sm text-[#736683]">
                No badges have been awarded yet.
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
