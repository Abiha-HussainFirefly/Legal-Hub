import ProfileAnalyticsPanel from "@/app/components/profile/ProfileAnalyticsPanel";
import type { ProfessionalProfile } from "@/types/profile";
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  ChevronRight,
  ExternalLink,
  Globe,
  GraduationCap,
  Languages,
  Linkedin,
  MapPin,
  Medal,
  Pencil,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";

function SectionCard({
  title,
  kicker,
  summary,
  children,
}: {
  title: string;
  kicker?: string;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex flex-col gap-2 border-b border-[var(--border-subtle)] pb-4">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {kicker}
          </p>
        ) : null}
        <h2 className="text-xl font-semibold text-[var(--heading)]">{title}</h2>
        {summary ? (
          <p className="max-w-2xl text-sm leading-7 text-[var(--text-muted)]">{summary}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SectionEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-5 text-sm text-[var(--text-muted)]">
      {label}
    </div>
  );
}

function formatMonthYear(value?: string) {
  if (!value) return "Present";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLongDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatConsultationStatus(value?: ProfessionalProfile["consultationStatus"]) {
  if (!value) return null;

  if (value === "AVAILABLE") return "Open to consultation";
  if (value === "LIMITED") return "Limited availability";

  return "Not taking consultations";
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SnapshotStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold tracking-[-0.04em] ${accent ?? "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function IdentityChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
      <span className="text-[var(--primary)]">{icon}</span>
      {children}
    </span>
  );
}

function TimelineItem({
  title,
  eyebrow,
  meta,
  description,
}: {
  title: string;
  eyebrow?: string;
  meta: string;
  description?: string;
}) {
  return (
    <div className="relative pl-7">
      <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-4 border-[var(--background-surface)] bg-[var(--primary)] shadow-[0_0_0_1px_var(--border-subtle)]" />
      <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-2 text-base font-semibold text-[var(--heading)]">{title}</h3>
        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{meta}</p>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function ProfessionalProfileView({
  profile,
  mode,
  contextLink,
}: {
  profile: ProfessionalProfile;
  mode: "owner" | "public";
  contextLink?: { href: string; label: string };
}) {
  const isVerified = profile.verificationStatus === "VERIFIED";
  const isOwner = mode === "owner";
  const showAnalytics =
    profile.heatmap.length > 0 || profile.analytics.postingRateLabel !== "Private analytics";
  const consultationStatus = formatConsultationStatus(profile.consultationStatus);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(76,47,94,0.12),transparent_28%),linear-gradient(180deg,var(--background-page)_0%,var(--background-card-nested)_100%)]">
      <div className="mx-auto max-w-[1320px] px-4 pb-14 pt-7 md:px-6 lg:px-8">
        {contextLink ? (
          <nav aria-label="Breadcrumb" className="mb-6 overflow-x-auto">
            <ol className="flex min-w-max items-center gap-2 text-sm">
              <li className="flex items-center gap-2">
                <Link
                  href={contextLink.href}
                  className="font-medium text-[#7C6B8E] transition hover:text-[#4C2F5E]"
                >
                  {contextLink.label}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-[#A294B1]" />
                <span className="font-semibold text-[#2F1D3B]" aria-current="page">
                  {profile.displayName}
                </span>
              </li>
            </ol>
          </nav>
        ) : null}

        <section className="overflow-hidden rounded-[34px] border border-[var(--border-subtle)] bg-[var(--background-surface)] shadow-[var(--shadow-elevated)]">
          <div
            className="relative overflow-hidden px-6 py-7 text-white md:px-8 md:py-8"
            style={{
              background:
                profile.coverImageUrl && profile.coverImageUrl.trim()
                  ? `linear-gradient(rgba(26,14,33,0.46), rgba(26,14,33,0.8)), url(${profile.coverImageUrl}) center/cover`
                  : "linear-gradient(135deg,#27162F 0%,#4B2E5F 48%,#7B5B96 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />

            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[32px] border border-white/15 bg-white/10 text-4xl font-semibold tracking-[-0.04em] shadow-[0_20px_36px_rgba(0,0,0,0.24)]">
                  {isOwner ? (
                    <Link
                      href="/profile/edit"
                      className="group relative block h-full w-full cursor-pointer"
                      aria-label="Edit profile image"
                    >
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt={profile.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          {getInitials(profile.displayName)}
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[rgba(27,18,36,0.78)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.28)] transition group-hover:scale-105 group-hover:bg-[rgba(27,18,36,0.92)]">
                        <Camera className="h-4 w-4" />
                      </span>
                    </Link>
                  ) : (
                    <>
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt={profile.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(profile.displayName)
                      )}
                    </>
                  )}
                </div>

                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    {isVerified ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/92 backdrop-blur-sm">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified lawyer
                      </span>
                    ) : null}
                    {profile.username ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/92 backdrop-blur-sm">
                        @{profile.username}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                    {profile.displayName}
                  </h1>
                  {profile.headline ? (
                    <p className="mt-3 max-w-2xl text-base leading-7 text-white/82 md:text-lg">
                      {profile.headline}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {profile.firmName || profile.company ? (
                      <IdentityChip icon={<BriefcaseBusiness className="h-4 w-4" />}>
                        {profile.roleTitle ? `${profile.roleTitle} / ` : ""}
                        {profile.firmName || profile.company}
                      </IdentityChip>
                    ) : null}
                    {profile.city || profile.regionName ? (
                      <IdentityChip icon={<MapPin className="h-4 w-4" />}>
                        {[profile.city, profile.regionName].filter(Boolean).join(", ")}
                      </IdentityChip>
                    ) : null}
                    {profile.yearsExperience ? (
                      <IdentityChip icon={<Star className="h-4 w-4" />}>
                        {profile.yearsExperience}+ years
                      </IdentityChip>
                    ) : null}
                    {consultationStatus ? (
                      <IdentityChip icon={<ShieldCheck className="h-4 w-4" />}>
                        {consultationStatus}
                      </IdentityChip>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {isOwner ? (
                      <>
                        <Link href="/profile/edit" className="legal-button-secondary text-sm">
                          <Pencil className="h-4 w-4" />
                          Edit profile
                        </Link>
                        {profile.username ? (
                          <Link
                            href={`/profile/${profile.username}`}
                            className="legal-button-primary text-sm"
                          >
                            View public profile
                          </Link>
                        ) : (
                          <Link href="/profile/setup" className="legal-button-primary text-sm">
                            Complete setup
                          </Link>
                        )}
                      </>
                    ) : (
                      <>
                        {profile.linkedInUrl ? (
                          <a
                            href={profile.linkedInUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="legal-button-secondary text-sm"
                          >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </a>
                        ) : null}
                        {profile.websiteUrl ? (
                          <a
                            href={profile.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="legal-button-primary text-sm"
                          >
                            <Globe className="h-4 w-4" />
                            Website
                          </a>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative grid gap-3 md:grid-cols-3 xl:grid-cols-2">
                <SnapshotStat
                  label="Community Level"
                  value={String(profile.analytics.level)}
                  accent="text-[#F8E2A7]"
                />
                <SnapshotStat
                  label="Contribution Points"
                  value={profile.analytics.points.toLocaleString()}
                />
                <SnapshotStat
                  label="Profile Views"
                  value={profile.analytics.profileViews.toLocaleString()}
                />
                <SnapshotStat
                  label="Badges Earned"
                  value={profile.badges.length.toLocaleString()}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-5 py-4 md:grid-cols-2 xl:grid-cols-4 md:px-8">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Last contribution
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--heading)]">
                {formatLongDate(profile.analytics.lastContributionAt) ?? "No recent contributions"}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Posting rhythm
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--heading)]">
                {profile.analytics.postingRateLabel}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Engagement trend
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--heading)]">
                {profile.analytics.trendLabel}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Member since
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--heading)]">
                {formatLongDate(profile.createdAt) ?? "Recently joined"}
              </p>
            </div>
          </div>
        </section>

        {isOwner ? (
          <div className="mt-6 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--background-surface)] p-5 shadow-[var(--shadow-card)] md:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Profile Completion
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--heading)]">
                  Professional profile readiness
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                  A complete profile increases trust, search visibility, and response quality across
                  Legal Hub.
                </p>
              </div>

              <div className="min-w-[220px] rounded-[22px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Completion score
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--heading)]">
                  {profile.completionPercentage}%
                </p>
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--background-card-nested)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(135deg,#4C2F5E_0%,#8D74A3_100%)]"
                style={{ width: `${profile.completionPercentage}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {profile.missingChecklist.length > 0 ? (
                profile.missingChecklist.map((item) => (
                  <span
                    key={item}
                    className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
                  Profile is complete and ready for discovery
                </span>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <SectionCard
              title="About"
              kicker="Professional Summary"
              summary="A concise overview of professional focus, expertise, and advisory style."
            >
              {profile.bio ? (
                <p className="max-w-3xl text-sm leading-8 text-[var(--foreground)]">
                  {profile.bio}
                </p>
              ) : (
                <SectionEmpty label="No professional summary has been shared." />
              )}
            </SectionCard>

            <SectionCard
              title="Professional Identity"
              kicker="Discovery Signals"
              summary="Practice areas, strengths, and signals that help other members understand this profile quickly."
            >
              {profile.practiceAreas.length === 0 && profile.skills.length === 0 ? (
                <SectionEmpty label="No practice areas or skills are visible on this profile." />
              ) : (
                <div className="space-y-5">
                  {profile.practiceAreas.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Practice Areas
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {profile.practiceAreas.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-3 py-2 text-sm font-medium text-[var(--heading)]"
                          >
                            {item.name}
                            {item.isPrimary ? " / Primary" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {profile.skills.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Skills
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {profile.skills.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)]"
                          >
                            {item.name}
                            {item.yearsExperience ? ` / ${item.yearsExperience}y` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Experience"
              kicker="Professional Record"
              summary="Career history, advisory work, and organizational experience."
            >
              {profile.experiences.length > 0 ? (
                <div className="relative space-y-5 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-px before:bg-[var(--border-subtle)]">
                  {profile.experiences.map((item) => (
                    <TimelineItem
                      key={item.id}
                      eyebrow={item.employmentType || undefined}
                      title={item.title}
                      meta={[
                        item.organization,
                        item.location,
                        `${formatMonthYear(item.startDate)} - ${
                          item.isCurrent ? "Present" : formatMonthYear(item.endDate)
                        }`,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                      description={item.description || undefined}
                    />
                  ))}
                </div>
              ) : (
                <SectionEmpty label="Experience details have not been added yet." />
              )}
            </SectionCard>

            <SectionCard
              title="Education"
              kicker="Academic Background"
              summary="Formal education, legal study, and academic preparation."
            >
              {profile.educations.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {profile.educations.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--background-surface)] text-[var(--primary)]">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-[var(--heading)]">
                            {item.institution}
                          </p>
                          <p className="mt-1 text-sm text-[var(--foreground)]">
                            {[item.degree, item.fieldOfStudy].filter(Boolean).join(" / ")}
                          </p>
                          <p className="mt-2 text-sm text-[var(--text-muted)]">
                            {formatMonthYear(item.startDate)} - {formatMonthYear(item.endDate)}
                          </p>
                          {item.description ? (
                            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <SectionEmpty label="Education details are not visible on this profile." />
              )}
            </SectionCard>

            <SectionCard
              title="Certifications and Recognition"
              kicker="Trust Signals"
              summary="Credentials, distinctions, and external recognition that support professional credibility."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Certifications
                  </p>
                  {profile.certifications.length > 0 ? (
                    profile.certifications.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4"
                      >
                        <p className="text-base font-semibold text-[var(--heading)]">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground)]">
                          {item.issuer || "Credential issuer not listed"}
                        </p>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                          {formatLongDate(item.issuedAt) || "Issue date unavailable"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <SectionEmpty label="No certifications are visible." />
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Recognition
                  </p>
                  {profile.awards.length > 0 ? (
                    profile.awards.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--background-surface)] text-[var(--primary)]">
                            <Medal className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-[var(--heading)]">
                              {item.title}
                            </p>
                            <p className="text-sm text-[var(--foreground)]">
                              {item.issuer || "Recognition"}
                            </p>
                            {item.awardedAt ? (
                              <p className="mt-2 text-sm text-[var(--text-muted)]">
                                {formatLongDate(item.awardedAt)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <SectionEmpty label="No professional awards are visible." />
                  )}
                </div>
              </div>
            </SectionCard>

            {showAnalytics ? (
              <ProfileAnalyticsPanel analytics={profile.analytics} heatmap={profile.heatmap} />
            ) : null}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <SectionCard
              title="Professional Snapshot"
              kicker="At a Glance"
              summary="A concise read on trust, availability, and current professional positioning."
            >
              <div className="space-y-3">
                <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Verification
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                    {isVerified ? "Verified lawyer" : "Standard member profile"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Availability
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--heading)]">
                    {consultationStatus || "Not specified"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Member Since
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
                    <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                    {formatLongDate(profile.createdAt) ?? "Recently joined"}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Contact and Languages"
              kicker="Public Reach"
              summary="External links and communication signals visible on this profile."
            >
              <div className="space-y-3">
                {profile.linkedInUrl ? (
                  <a
                    href={profile.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3 text-sm font-medium text-[var(--heading)] transition hover:bg-[var(--background-surface)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-[var(--primary)]" />
                      LinkedIn
                    </span>
                    <ExternalLink className="h-4 w-4 text-[var(--icon-muted)]" />
                  </a>
                ) : null}
                {profile.websiteUrl ? (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3 text-sm font-medium text-[var(--heading)] transition hover:bg-[var(--background-surface)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[var(--primary)]" />
                      Website
                    </span>
                    <ExternalLink className="h-4 w-4 text-[var(--icon-muted)]" />
                  </a>
                ) : null}
                {profile.socialLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] px-4 py-3 text-sm font-medium text-[var(--heading)] transition hover:bg-[var(--background-surface)]"
                  >
                    <span>{item.label || item.platform}</span>
                    <ExternalLink className="h-4 w-4 text-[var(--icon-muted)]" />
                  </a>
                ))}
                {profile.linkedInUrl || profile.websiteUrl || profile.socialLinks.length > 0 ? null : (
                  <SectionEmpty label="No public contact links are visible." />
                )}

                {profile.languages.length > 0 ? (
                  <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
                      <Languages className="h-4 w-4 text-[var(--primary)]" />
                      Languages
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.languages.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]"
                        >
                          {item.name}
                          {item.proficiency ? ` / ${item.proficiency}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              title="Badges and Recognition"
              kicker="Community Trust"
              summary="Signals earned through contribution and community participation."
            >
              {profile.badges.length > 0 ? (
                <div className="space-y-3">
                  {profile.badges.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--background-surface)] text-[var(--primary)]">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--heading)]">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
                            {item.description || "Community badge"}
                          </p>
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                            Awarded {formatLongDate(item.awardedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <SectionEmpty label="No badges are currently visible on this profile." />
              )}
            </SectionCard>

            <SectionCard
              title="Recent Contributions"
              kicker="Public Work"
              summary="Recent visible work across discussions, answers, and case activity."
            >
              {profile.recentContributions.length > 0 ? (
                <div className="space-y-3">
                  {profile.recentContributions.map((item) => (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      className="block rounded-[20px] border border-[var(--border-subtle)] bg-[var(--background-card-nested)] p-4 transition hover:bg-[var(--background-surface)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--background-surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                          {item.kind}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatLongDate(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[var(--heading)]">
                        {item.title}
                      </p>
                      {item.detail ? (
                        <p className="mt-1 text-sm text-[var(--foreground)]">{item.detail}</p>
                      ) : null}
                      {item.metricLabel ? (
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                          {item.metricLabel}
                        </p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : (
                <SectionEmpty label="No recent public contributions are visible." />
              )}
            </SectionCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
