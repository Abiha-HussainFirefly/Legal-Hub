import { adminGamificationAction } from "@/app/actions/admin-platform";
import { getAdminGamificationPageData } from "@/lib/services/admin.server";
import { Award, BadgeCheck, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function badgeStateClasses(isActive: boolean) {
  return isActive ? "bg-[#E6F5EF] text-[#0E7A55]" : "bg-[#FCE8E6] text-[#A33A31]";
}

export default async function GamificationPage() {
  const data = await getAdminGamificationPageData();

  const summaryCards = [
    {
      title: "Badge Catalog",
      value: formatNumber(data.summary.badges),
      detail: `${formatNumber(data.summary.activeBadges)} active badges`,
      icon: Award,
    },
    {
      title: "Awarded Badges",
      value: formatNumber(data.summary.awardedBadges),
      detail: "Historical badge awards stored with traceability",
      icon: BadgeCheck,
    },
    {
      title: "Points Awarded",
      value: formatNumber(data.summary.totalPointsAwarded),
      detail: "Aggregate points currently represented by the event ledger",
      icon: Sparkles,
    },
    {
      title: "Manual Adjustments 30d",
      value: formatNumber(data.summary.manualAdjustments30d),
      detail: "High-privilege interventions over the last 30 days",
      icon: Crown,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">Badges & Gamification</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
          Ranking controls, badge governance, and ledger-aware interventions.
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
          This surface connects leaderboard read models with badge catalog governance and manual interventions. Every
          controlled points change writes a gamification event so admins can reconcile projections back to ledger truth.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="legal-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{card.title}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#102033]">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
                </div>
                <div className="rounded-[18px] bg-[#F4EFF8] p-3 text-[#4C2F5E]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="legal-panel p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Contributor Leaderboard</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Compare top contributors by total points, accepted answers, badges, and published cases.
              </p>
            </div>
            <Crown className="h-5 w-5 text-[#4C2F5E]" />
          </div>

          <div className="mt-5 space-y-3">
            {data.leaders.map((leader, index) => (
              <div key={leader.userId} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#2F1D3B]">
                      {index + 1}. {leader.displayName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {leader.username ? `@${leader.username}` : "No username"} / Level {leader.level}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {leader.acceptedAnswers} accepted answers / {leader.casesPublished} published cases / {leader.badgesCount} badges
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[#4C2F5E]">{formatNumber(leader.totalPoints)}</p>
                    <p className="text-xs text-slate-500">points</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/user/${leader.userId}?tab=profile`} className="legal-button-secondary text-sm">
                    Open User Record
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="legal-panel p-5 md:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Create Badge</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Create a new catalog badge with a stable code and point value. Avoid destructive edits once awards exist.
            </p>
            <form action={adminGamificationAction} className="mt-5 space-y-3">
              <input type="hidden" name="intent" value="create_badge" />
              <input name="code" placeholder="badge_code" className="legal-field" required />
              <input name="name" placeholder="Badge name" className="legal-field" required />
              <input name="pointsAwarded" placeholder="Points awarded" type="number" className="legal-field" />
              <textarea name="description" placeholder="Badge description" className="legal-field min-h-[110px]" />
              <input name="reason" placeholder="Reason for catalog change" className="legal-field" required />
              <button type="submit" className="legal-button-primary w-full">
                Create Badge
              </button>
            </form>
          </section>

          <section className="legal-panel p-5 md:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Award Badge</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Award badges through an audited workflow that records the actor and reason.
            </p>
            <form action={adminGamificationAction} className="mt-5 space-y-3">
              <input type="hidden" name="intent" value="award_badge" />
              <select name="badgeId" className="legal-field" defaultValue="" required>
                <option value="" disabled>
                  Select badge
                </option>
                {data.badges.map((badge) => (
                  <option key={badge.id} value={badge.id}>
                    {badge.name} / {badge.code} / {badge.pointsAwarded} pts
                  </option>
                ))}
              </select>
              <input name="userId" placeholder="Target user ID" className="legal-field" required />
              <input name="reason" placeholder="Award reason" className="legal-field" required />
              <button type="submit" className="legal-button-primary w-full">
                Award Badge
              </button>
            </form>
          </section>

          <section className="legal-panel p-5 md:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Manual Point Adjustment</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Reserved for highest-privilege correction workflows. Every change becomes a `MANUAL_ADJUSTMENT` event.
            </p>
            <form action={adminGamificationAction} className="mt-5 space-y-3">
              <input type="hidden" name="intent" value="manual_adjustment" />
              <input name="userId" placeholder="Target user ID" className="legal-field" required />
              <input name="pointsDelta" type="number" placeholder="Points delta, positive or negative" className="legal-field" required />
              <input name="reason" placeholder="Reason for manual adjustment" className="legal-field" required />
              <button type="submit" className="legal-button-secondary w-full">
                Apply Adjustment
              </button>
            </form>
          </section>
        </div>
      </div>

      <section className="legal-panel p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Badge Catalog</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Active and retired badges remain visible here. Retirement is safer than deletion after awards exist.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {data.badges.map((badge) => (
            <div key={badge.id} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStateClasses(badge.isActive)}`}>
                      {badge.isActive ? "Active" : "Retired"}
                    </span>
                    <span className="workspace-pill">{badge.code}</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-[#2F1D3B]">{badge.name}</p>
                  <p className="mt-2 text-sm text-slate-600">{badge.description ?? "No description recorded."}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {badge.pointsAwarded} points / {badge.awardCount} awards issued
                  </p>
                </div>

                <form action={adminGamificationAction} className="grid gap-3 xl:w-[240px]">
                  <input type="hidden" name="intent" value="toggle_badge" />
                  <input type="hidden" name="badgeId" value={badge.id} />
                  <input type="hidden" name="nextActive" value={badge.isActive ? "false" : "true"} />
                  <input name="reason" placeholder="Reason for state change" className="legal-field" required />
                  <button type="submit" className="legal-button-secondary text-sm">
                    {badge.isActive ? "Retire Badge" : "Reactivate Badge"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="legal-panel p-5 md:p-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Recent Badge Awards</h2>
          <div className="mt-5 space-y-3">
            {data.recentAwards.map((award) => (
              <div key={award.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <p className="text-sm font-semibold text-[#2F1D3B]">{award.badgeName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {award.displayName} / {formatDate(award.awardedAt)} / {award.awardedBy ?? "System"}
                </p>
                <p className="mt-2 text-sm text-slate-600">{award.reason ?? "No reason recorded."}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="legal-panel p-5 md:p-6">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Recent Manual Adjustments</h2>
          <div className="mt-5 space-y-3">
            {data.recentManualAdjustments.map((event) => (
              <div key={event.id} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#2F1D3B]">{event.displayName}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.pointsDelta >= 0 ? "bg-[#E6F5EF] text-[#0E7A55]" : "bg-[#FCE8E6] text-[#A33A31]"}`}>
                    {event.pointsDelta >= 0 ? "+" : ""}
                    {event.pointsDelta} pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{formatDate(event.createdAt)}</p>
                <p className="mt-2 text-sm text-slate-600">{event.metadataSummary ?? "No metadata summary stored."}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
