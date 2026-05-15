import AdminUserDetailSections from "@/app/(admin)/user/[id]/AdminUserDetailSections";
import { getAdminUserDetailData } from "@/lib/services/admin.server";
import Link from "next/link";
import { notFound } from "next/navigation";

const USER_TABS = [
  { key: "overview", label: "Overview" },
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "identifiers", label: "Identifiers" },
  { key: "roles", label: "Roles & Permissions" },
  { key: "organizations", label: "Organizations" },
  { key: "content", label: "Content" },
  { key: "trust", label: "Trust & Verification" },
  { key: "notifications", label: "Notifications" },
  { key: "audit", label: "Audit Timeline" },
] as const;

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function prettyText(value: string | null) {
  if (!value) return "None";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: Date | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function statusClass(value: string) {
  switch (value) {
    case "ACTIVE":
    case "VERIFIED":
      return "bg-[#E8F4EF] text-[#1B7A5A]";
    case "PENDING":
    case "UNDER_REVIEW":
    case "SUSPENDED":
      return "bg-[#F6EBD6] text-[#8B642A]";
    case "DISABLED":
    case "DELETED":
    case "REJECTED":
    case "EXPIRED":
      return "bg-[#FCE8E6] text-[#A33A31]";
    default:
      return "bg-[#EEF2F7] text-[#36506E]";
  }
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const activeTab = USER_TABS.some((tab) => tab.key === getFirstParam(resolvedSearchParams.tab))
    ? (getFirstParam(resolvedSearchParams.tab) as (typeof USER_TABS)[number]["key"])
    : "overview";

  const data = await getAdminUserDetailData(id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(data.user.status)}`}>
                {prettyText(data.user.status)}
              </span>
              <span className="rounded-full border border-[#4C2F5E]/12 bg-[#F4EFF8] px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                {prettyText(data.user.userType)}
              </span>
              {data.trustVerification.lawyerProfile?.verificationStatus ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                    data.trustVerification.lawyerProfile.verificationStatus,
                  )}`}
                >
                  {prettyText(data.trustVerification.lawyerProfile.verificationStatus)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">{data.user.displayName}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
              Identity summary, security posture, role history, organization memberships, trust state, and audit-linked
              platform activity for this account.
            </p>
          </div>

          <div className="grid gap-3 xl:w-[520px]">
            <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Primary Email</p>
              <p className="mt-2 break-all text-sm font-semibold leading-7 text-[#2F1D3B]">
                {data.user.primaryEmail ?? "No primary email"}
              </p>
            </div>

            <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Last Login</p>
              <p className="mt-2 text-sm font-semibold leading-7 text-[#2F1D3B]">{formatDateTime(data.user.lastLoginAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="legal-panel overflow-x-auto px-4 py-3">
        <div className="flex min-w-max gap-2">
          {USER_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/user/${data.user.id}?tab=${tab.key}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-[#102033] text-white"
                  : "border border-[#4C2F5E]/12 bg-white text-[#4C2F5E] hover:bg-[#FBF9FD]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </section>

      <AdminUserDetailSections
        userId={data.user.id}
        activeTab={activeTab}
        searchParams={resolvedSearchParams}
        data={data}
      />
    </div>
  );
}
