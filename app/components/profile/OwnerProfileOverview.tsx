import Link from "next/link";
import type { ProfessionalProfile } from "@/types/profile";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Globe,
  GraduationCap,
  Languages,
  Link as LinkIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";

function SectionCard({
  title,
  summary,
  icon,
  className = "",
  actions = [],
  children,
}: {
  title: string;
  summary?: string;
  icon?: React.ReactNode;
  className?: string;
  actions?: Array<{ href: string; label: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className={`workspace-sidebar p-5 lh-page-enter lh-surface-lift ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
              {icon}
            </div>
          ) : null}
          <div>
            <h2 className="text-lg font-semibold text-[#2F1D3B]">{title}</h2>
            {summary ? <p className="mt-1 text-sm leading-7 text-[#736683]">{summary}</p> : null}
          </div>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Link
                key={`${title}-${action.href}-${action.label}`}
                href={action.href}
                className="inline-flex items-center rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-2 text-xs font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{value || "Not added yet"}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-[#4C2F5E]/12 bg-[#FBF9FD] px-4 py-5 text-sm text-[#736683]">
      {label}
    </div>
  );
}

function formatDateRange(start?: string, end?: string, current?: boolean) {
  const formatter = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });
  const startLabel = start ? formatter.format(new Date(start)) : "Start not set";
  const endLabel = current ? "Present" : end ? formatter.format(new Date(end)) : "End not set";
  return `${startLabel} - ${endLabel}`;
}

export default function OwnerProfileOverview({ profile }: { profile: ProfessionalProfile }) {
  const personalLocation = [profile.city, profile.regionName].filter(Boolean).join(", ");
  const professionalBase = profile.firmName || profile.company;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Personal details"
            summary="Core identity and contact information used throughout your account."
            icon={<UserRound className="h-4 w-4" />}
            className="lh-delay-1"
            actions={[{ href: "/profile/edit?step=identity", label: "Edit section" }]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Display name" value={profile.displayName} />
              <DetailRow label="Username" value={profile.username ? `@${profile.username}` : null} />
              <DetailRow label="Email" value={profile.email} />
              <DetailRow label="Phone" value={profile.phone} />
              <DetailRow label="Location" value={personalLocation} />
              <DetailRow label="Office address" value={profile.officeAddress} />
            </div>
          </SectionCard>

          <SectionCard
            title="Professional details"
            summary="Trust signals and role information shown to members and public visitors."
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            className="lh-delay-2"
            actions={[{ href: "/profile/edit?step=identity", label: "Edit section" }]}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Headline" value={profile.headline} />
              <DetailRow label="Role title" value={profile.roleTitle} />
              <DetailRow label="Organization" value={professionalBase} />
              <DetailRow label="Bar council" value={profile.barCouncil} />
              <DetailRow label="Years experience" value={profile.yearsExperience ? `${profile.yearsExperience}+ years` : null} />
              <DetailRow label="Consultation status" value={profile.consultationStatus || null} />
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="About"
          summary="Your public summary should explain expertise, focus, and how others should engage with you."
          icon={<BadgeCheck className="h-4 w-4" />}
          className="lh-delay-2"
          actions={[{ href: "/profile/edit?step=summary", label: "Edit section" }]}
        >
          {profile.bio ? (
            <p className="text-sm leading-8 text-[#4A3B58]">{profile.bio}</p>
          ) : (
            <EmptyState label="Add a concise bio so clients, students, and other members understand your focus quickly." />
          )}
        </SectionCard>

        <SectionCard
          title="Experience"
          summary="A compact timeline of practice history and current professional positioning."
          icon={<Building2 className="h-4 w-4" />}
          className="lh-delay-3"
          actions={[{ href: "/profile/edit?step=background", label: "Edit section" }]}
        >
          {profile.experiences.length > 0 ? (
            <div className="space-y-3 border-l border-[#4C2F5E]/10 pl-4">
              {profile.experiences.map((item) => (
                <div key={item.id ?? `${item.title}-${item.organization}`} className="relative rounded-[18px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
                  <span className="absolute -left-[22px] top-5 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#4C2F5E]" />
                  <p className="text-base font-semibold text-[#2F1D3B]">{item.title || "Role title missing"}</p>
                  <p className="mt-1 text-sm font-medium text-[#5F506D]">{item.organization || "Organization missing"}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                    {formatDateRange(item.startDate, item.endDate, item.isCurrent)}
                  </p>
                  {item.description ? <p className="mt-3 text-sm leading-7 text-[#736683]">{item.description}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No experience entries added yet." />
          )}
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Education"
            summary="Degrees, institutions, and formal study supporting your profile."
            icon={<GraduationCap className="h-4 w-4" />}
            className="lh-delay-2"
            actions={[{ href: "/profile/edit?step=background", label: "Edit section" }]}
          >
            {profile.educations.length > 0 ? (
              <div className="space-y-3">
                {profile.educations.map((item) => (
                  <div
                    key={item.id ?? `${item.institution}-${item.degree}`}
                    className="rounded-[18px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4"
                  >
                    <p className="text-base font-semibold text-[#2F1D3B]">{item.institution}</p>
                    <p className="mt-1 text-sm text-[#5F506D]">
                      {[item.degree, item.fieldOfStudy].filter(Boolean).join(" | ") || "Degree details missing"}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                      {formatDateRange(item.startDate, item.endDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState label="No education details have been added." />
            )}
          </SectionCard>

          <SectionCard
            title="Certifications and awards"
            summary="Formal credentials and recognized professional achievements."
            icon={<ShieldCheck className="h-4 w-4" />}
            className="lh-delay-3"
            actions={[{ href: "/profile/edit?step=trust", label: "Edit section" }]}
          >
            <div className="space-y-3">
              {profile.certifications.length > 0 ? (
                profile.certifications.map((item) => (
                  <div key={item.id ?? item.name} className="rounded-[18px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
                    <p className="text-base font-semibold text-[#2F1D3B]">{item.name}</p>
                    <p className="mt-1 text-sm text-[#5F506D]">{item.issuer || "Issuer not added"}</p>
                  </div>
                ))
              ) : null}
              {profile.awards.length > 0 ? (
                profile.awards.map((item) => (
                  <div key={item.id ?? item.title} className="rounded-[18px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
                    <p className="text-base font-semibold text-[#2F1D3B]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#5F506D]">{item.issuer || "Award source not added"}</p>
                  </div>
                ))
              ) : null}
              {profile.certifications.length === 0 && profile.awards.length === 0 ? (
                <EmptyState label="No certifications or awards have been added." />
              ) : null}
            </div>
          </SectionCard>
        </div>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
        <SectionCard
          title="Practice focus"
          summary="The areas and skills that help users understand what you can help with."
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          className="lh-delay-1"
          actions={[{ href: "/profile/edit?step=expertise", label: "Edit section" }]}
        >
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Practice areas</p>
              {profile.practiceAreas.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.practiceAreas.map((item) => (
                    <span key={item.id} className="workspace-pill">
                      {item.name}
                      {item.yearsExperience ? ` | ${item.yearsExperience}y` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3"><EmptyState label="No practice areas selected yet." /></div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Skills</p>
              {profile.skills.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.map((item) => (
                    <span key={item.id ?? item.name} className="rounded-full border border-[#4C2F5E]/8 bg-[#F8F6FB] px-3 py-1.5 text-xs font-semibold text-[#5F506D]">
                      {item.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3"><EmptyState label="No skills added yet." /></div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Languages and links"
          summary="Communication and external profile links used by visitors."
          icon={<Globe className="h-4 w-4" />}
          className="lh-delay-2"
          actions={[
            { href: "/profile/edit?step=expertise", label: "Edit languages" },
            { href: "/profile/edit?step=summary", label: "Edit links" },
          ]}
        >
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Languages</p>
              {profile.languages.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.languages.map((item) => (
                    <span key={item.id ?? item.name} className="workspace-pill border-[#4C2F5E]/8 bg-white text-[#5F506D]">
                      <Languages className="h-3.5 w-3.5" />
                      {item.name}
                      {item.proficiency ? ` · ${item.proficiency}` : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-3"><EmptyState label="No languages have been added." /></div>
              )}
            </div>

            <div className="space-y-3">
              <DetailRow label="Website" value={profile.websiteUrl} />
              <DetailRow label="LinkedIn" value={profile.linkedInUrl} />
              {profile.socialLinks.length > 0 ? (
                profile.socialLinks.map((item) => (
                  <div key={item.id ?? item.url} className="rounded-[16px] border border-[#4C2F5E]/8 bg-[#FBF9FD] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">
                      {item.label || item.platform}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#2F1D3B]">
                      <LinkIcon className="h-4 w-4 text-[#8B7D99]" />
                      <span className="truncate">{item.url}</span>
                    </p>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </SectionCard>
      </aside>
    </div>
  );
}
