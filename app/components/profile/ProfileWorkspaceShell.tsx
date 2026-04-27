import AnimatedLink from "@/app/components/ui/animated-link";
import type { ProfessionalProfile } from "@/types/profile";
import {
  BarChart3,
  CheckCircle2,
  Circle,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatConsultationStatus(value?: ProfessionalProfile["consultationStatus"]) {
  if (!value) return "Consultation status not set";
  if (value === "AVAILABLE") return "Open to consultations";
  if (value === "LIMITED") return "Limited consultation availability";
  return "Not taking consultations";
}

function formatMemberSince(value?: string) {
  if (!value) return "Recently joined";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function TabLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <AnimatedLink
      href={href}
      className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[#4C2F5E] text-white shadow-[0_8px_18px_rgba(76,47,94,0.18)]"
          : "text-[#6B5C79] hover:bg-[#F7F3FA] hover:text-[#4C2F5E]"
      }`}
    >
      {icon}
      {label}
    </AnimatedLink>
  );
}

export default function ProfileWorkspaceShell({
  profile,
  activeTab,
  children,
}: {
  profile: ProfessionalProfile;
  activeTab: "profile" | "stats";
  children: React.ReactNode;
}) {
  const consultationStatus = formatConsultationStatus(profile.consultationStatus);
  const needsSetup = profile.completionPercentage < 100 || profile.missingChecklist.length > 0;
  const primaryAction = needsSetup
    ? { href: "/profile/setup", label: "Complete profile" }
    : { href: "/profile/edit", label: "Edit profile" };
  const location = [profile.city, profile.regionName].filter(Boolean).join(", ");
  const coverBackground =
    profile.coverImageUrl && profile.coverImageUrl.trim()
      ? `linear-gradient(rgba(26,14,33,0.48), rgba(26,14,33,0.72)), url(${profile.coverImageUrl}) center/cover`
      : "linear-gradient(135deg,#27162F 0%,#4B2E5F 48%,#7B5B96 100%)";

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-6 lg:px-8 lh-page-enter">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section className="workspace-header overflow-hidden p-0 lh-page-enter lh-delay-1">
          <div className="relative h-28 md:h-36" style={{ background: coverBackground }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />
          </div>
          <div className="px-5 pb-5 pt-0 md:px-6 md:pb-6">
            <div className="-mt-12 flex flex-col gap-6 md:-mt-14">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[26px] border border-[#4C2F5E]/12 bg-[#4C2F5E] text-2xl font-semibold tracking-[-0.04em] text-white shadow-[0_16px_32px_rgba(76,47,94,0.18)]">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                  ) : (
                  getInitials(profile.displayName)
                )}
              </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="legal-kicker">
                      <Sparkles className="h-3.5 w-3.5" />
                      Account workspace
                    </span>
                    {profile.verificationStatus === "VERIFIED" ? (
                      <span className="workspace-pill border-emerald-200 bg-emerald-50 text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#2F1D3B] md:text-[2.6rem]">
                    {profile.displayName}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#736683]">
                    {profile.username ? <span>@{profile.username}</span> : null}
                    {profile.headline ? <span>{profile.headline}</span> : null}
                    {profile.firmName || profile.company ? (
                      <span>{profile.roleTitle ? `${profile.roleTitle} at ` : ""}{profile.firmName || profile.company}</span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {location ? (
                      <span className="workspace-pill border-[#4C2F5E]/8 bg-white text-[#736683]">
                        <MapPin className="h-3.5 w-3.5" />
                        {location}
                      </span>
                    ) : null}
                    <span className="workspace-pill border-[#4C2F5E]/8 bg-white text-[#736683]">
                      <Mail className="h-3.5 w-3.5" />
                      {profile.email || "Email not added"}
                    </span>
                    <span className="workspace-pill border-[#4C2F5E]/8 bg-white text-[#736683]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {consultationStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <AnimatedLink href={primaryAction.href} className="legal-button-primary justify-center text-sm w-full sm:w-auto">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {primaryAction.label}
                </AnimatedLink>
                <AnimatedLink href="/profile/edit" className="legal-button-secondary justify-center text-sm w-full sm:w-auto">
                  <Pencil className="h-4 w-4 shrink-0" />
                  Edit details
                </AnimatedLink>
                {profile.username ? (
                  <AnimatedLink
                    href={`/profile/${profile.username}`}
                    className="inline-flex justify-center items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA] w-full sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    View public profile
                  </AnimatedLink>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <aside className="workspace-sidebar p-5 lh-page-enter lh-delay-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">
            Profile readiness
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#2F1D3B]">Complete your account</h2>
            <span className="text-2xl font-semibold tracking-[-0.04em] text-[#4C2F5E]">
              {profile.completionPercentage}%
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#736683]">
            Keep identity, professional trust signals, and public-facing details current in one place.
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E9E1F0]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#4C2F5E_0%,#8D74A3_100%)] transition-[width] duration-500"
              style={{ width: `${profile.completionPercentage}%` }}
            />
          </div>

          <div className="mt-4 space-y-2">
            {profile.missingChecklist.length > 0 ? (
              profile.missingChecklist.slice(0, 4).map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-[14px] border border-[#4C2F5E]/8 bg-[#F8F6FB] px-3 py-2.5 text-sm text-[#5F506D]"
                >
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8D74A3]" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Your profile is complete and ready for public trust building.</span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-[16px] border border-[#4C2F5E]/8 bg-white px-4 py-3 text-sm text-[#736683]">
            Member since <span className="font-semibold text-[#2F1D3B]">{formatMemberSince(profile.createdAt)}</span>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 rounded-[18px] border border-[#4C2F5E]/10 bg-white p-2 shadow-[0_12px_24px_rgba(76,47,94,0.05)] lh-page-enter lh-delay-2">
        <div className="flex flex-1 sm:flex-none gap-2">
          <TabLink
            href="/profile"
            label="Profile"
            icon={<Pencil className="h-4 w-4 shrink-0" />}
            active={activeTab === "profile"}
          />
          <TabLink
            href="/profile/stats"
            label="Stats"
            icon={<BarChart3 className="h-4 w-4 shrink-0" />}
            active={activeTab === "stats"}
          />
        </div>
        <div className="sm:ml-auto rounded-[14px] bg-[#F8F6FB] px-3 py-2 text-xs font-semibold text-[#736683] text-center">
          {needsSetup ? `${profile.missingChecklist.length} checklist item${profile.missingChecklist.length === 1 ? "" : "s"} pending` : "Profile complete"}
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
