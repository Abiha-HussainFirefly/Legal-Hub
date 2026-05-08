import { adminUserLifecycleAction } from "@/app/actions/admin-users";
import { adminUserRoleAssignmentAction } from "@/app/actions/admin-rbac";
import { getAdminUserDetailData } from "@/lib/services/admin.server";
import { notFound } from "next/navigation";
import Link from "next/link";

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

function Panel({
  title,
  children,
  description,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-panel p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
        {description ? <p className="text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DetailGrid({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{item.label}</p>
          <div className="mt-2 text-sm leading-7 text-[#2F1D3B]">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function ActionForm({
  userId,
  intent,
  title,
  description,
  reasonRequired = true,
}: {
  userId: string;
  intent: string;
  title: string;
  description: string;
  reasonRequired?: boolean;
}) {
  return (
    <form action={adminUserLifecycleAction} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="intent" value={intent} />
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[#2F1D3B]">{title}</p>
          <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
        </div>
        <input
          name="reason"
          required={reasonRequired}
          placeholder={reasonRequired ? "Reason is required" : "Optional reason"}
          className="legal-field"
        />
        <button type="submit" className="legal-button-primary text-sm">
          Confirm
        </button>
      </div>
    </form>
  );
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
  const activeTab = USER_TABS.some((tab) => tab.key === getFirstParam(resolvedSearchParams.tab)) ?
    (getFirstParam(resolvedSearchParams.tab) as (typeof USER_TABS)[number]["key"]) :
    "overview";

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
              platform activity for user ID <span className="font-semibold text-[#2F1D3B]">{data.user.id}</span>.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <div className="flex min-h-[104px] flex-col justify-between overflow-hidden rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Primary Email</p>
              <p className="mt-3 break-words text-sm font-semibold leading-6 text-[#2F1D3B]">
                {data.user.primaryEmail ?? "No primary email"}
              </p>
            </div>
            <div className="flex min-h-[104px] flex-col justify-between overflow-hidden rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Last Login</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#2F1D3B]">{formatDateTime(data.user.lastLoginAt)}</p>
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

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <Panel title="Identity Summary">
            <DetailGrid
              items={[
                { label: "Username", value: data.user.username ?? "No username" },
                { label: "Primary Phone", value: data.user.primaryPhone ?? "No primary phone" },
                { label: "Region", value: data.user.regionName ?? "No region set" },
                { label: "Created", value: formatDateTime(data.user.createdAt) },
                { label: "Updated", value: formatDateTime(data.user.updatedAt) },
                { label: "Deleted At", value: formatDateTime(data.user.deletedAt) },
                { label: "Lawyer Flag", value: data.user.isLawyer ? "Yes" : "No" },
                { label: "Organization Memberships", value: `${data.user.organizationCount}` },
                { label: "Headline", value: data.user.headline ?? "No headline" },
              ]}
            />
          </Panel>

          <Panel
            title="Controlled Actions"
            description="These actions enforce status transitions through server-side commands and write audit events. Reason capture is mandatory except for session revocation."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <ActionForm userId={data.user.id} intent="suspend" title="Suspend Account" description="Use for temporary platform access suspension. Active sessions are revoked." />
              <ActionForm userId={data.user.id} intent="disable" title="Disable Account" description="Use for hard operational disablement. Active sessions are revoked." />
              <ActionForm userId={data.user.id} intent="restore" title="Restore Account" description="Return the account to ACTIVE and clear deleted state if present." />
              <ActionForm userId={data.user.id} intent="soft_delete" title="Soft Delete Account" description="Marks the account deleted without destroying forensic data." />
              <ActionForm userId={data.user.id} intent="revoke_sessions" title="Revoke Active Sessions" description="Revokes all active sessions for this user immediately." reasonRequired={false} />
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "profile" ? (
        <div className="space-y-6">
          <Panel title="Public Profile">
            <DetailGrid
              items={[
                { label: "Bio", value: data.user.bio ?? "No bio" },
                { label: "City", value: data.user.city ?? "No city" },
                { label: "Country", value: data.user.countryCode ?? "No country" },
                { label: "Website", value: data.profile.websiteUrl ?? "No website" },
                { label: "LinkedIn", value: data.profile.linkedInUrl ?? "No LinkedIn URL" },
                { label: "Completion", value: `${data.profile.completionPercentage}% / ${prettyText(data.profile.completionState)}` },
              ]}
            />
          </Panel>

          <Panel title="Trust Signals">
            <DetailGrid
              items={[
                { label: "Discussions", value: `${data.profile.stats?.discussionCount ?? 0}` },
                { label: "Answers", value: `${data.profile.stats?.answerCount ?? 0}` },
                { label: "Comments", value: `${data.profile.stats?.commentCount ?? 0}` },
                { label: "Cases", value: `${data.profile.stats?.caseCount ?? 0}` },
                { label: "Accepted Answers", value: `${data.profile.stats?.acceptedAnswerCount ?? 0}` },
                { label: "Contribution Score", value: `${data.profile.stats?.contributionScore ?? 0}` },
                { label: "Total Points", value: `${data.profile.gamification?.totalPoints ?? 0}` },
                { label: "Level", value: `${data.profile.gamification?.level ?? 0}` },
                { label: "Badges", value: `${data.profile.gamification?.badgesCount ?? 0}` },
              ]}
            />
          </Panel>

          <Panel title="Awarded Badges">
            <div className="space-y-3">
              {data.profile.badges.length ? (
                data.profile.badges.map((badge) => (
                  <div key={badge.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-sm font-semibold text-[#2F1D3B]">{badge.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {badge.code} / {formatDateTime(badge.awardedAt)} / {badge.awardedBy ?? "System"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{badge.reason ?? "No award reason stored."}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No badges have been awarded to this user.</p>
              )}
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "security" ? (
        <div className="space-y-6">
          <Panel title="Credential & MFA">
            <DetailGrid
              items={[
                { label: "Password Set", value: formatDateTime(data.security.credential?.passwordSetAt ?? null) },
                { label: "Must Rotate", value: data.security.credential?.mustRotate ? "Yes" : "No" },
                { label: "Failed Attempts", value: `${data.security.credential?.failedAttempts ?? 0}` },
                { label: "Locked Until", value: formatDateTime(data.security.credential?.lockedUntil ?? null) },
                { label: "Recovery Codes Remaining", value: `${data.security.recoveryCodes.remaining}` },
                { label: "Last Known User Agent", value: data.user.lastUserAgent ?? "Not recorded" },
              ]}
            />
          </Panel>

          <Panel title="MFA Factors">
            <div className="space-y-3">
              {data.security.mfaFactors.length ? (
                data.security.mfaFactors.map((factor) => (
                  <div key={factor.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(factor.status)}`}>
                        {prettyText(factor.status)}
                      </span>
                      <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#4C2F5E]">
                        {prettyText(factor.type)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#2F1D3B]">{factor.label ?? "Unlabeled factor"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Created {formatDateTime(factor.createdAt)} / Last used {formatDateTime(factor.lastUsedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No MFA factors are enrolled.</p>
              )}
            </div>
          </Panel>

          <Panel title="Recent Sessions">
            <div className="space-y-3">
              {data.security.sessions.length ? (
                data.security.sessions.map((session) => (
                  <div key={session.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(session.revokedAt ? "DISABLED" : "ACTIVE")}`}>
                        {session.revokedAt ? "Revoked" : "Active"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#2F1D3B]">{session.deviceLabel ?? "Unlabeled device"}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Seen {formatDateTime(session.lastSeenAt)} / Expires {formatDateTime(session.expiresAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{session.userAgent ?? "No user agent"} / {session.ip ?? "No IP"}</p>
                    {session.revokeReason ? <p className="mt-2 text-xs text-[#A33A31]">Reason: {session.revokeReason}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No sessions recorded.</p>
              )}
            </div>
          </Panel>

          <Panel title="Login Attempts">
            <div className="space-y-3">
              {data.security.loginAttempts.map((attempt) => (
                <div key={attempt.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(attempt.success ? "ACTIVE" : "DISABLED")}`}>
                      {attempt.success ? "Success" : "Failed"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#2F1D3B]">{attempt.identifierValue ?? "No identifier captured"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {attempt.failureReason ?? "No failure reason"} / {formatDateTime(attempt.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "identifiers" ? (
        <Panel title="Identifiers">
          <div className="space-y-3">
            {data.identifiers.map((identifier) => (
              <div key={identifier.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#4C2F5E]">
                    {prettyText(identifier.type)}
                  </span>
                  {identifier.isPrimary ? (
                    <span className="rounded-full bg-[#102033] px-2.5 py-1 text-xs font-semibold text-white">Primary</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{identifier.value}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Verified {formatDateTime(identifier.verifiedAt)} / Added {formatDateTime(identifier.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {activeTab === "roles" ? (
        <div className="space-y-6">
          <Panel
            title="Role Controls"
            description="Role assignment and removal are audited security actions. Self-targeted role changes are blocked from this portal."
          >
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <form action={adminUserRoleAssignmentAction} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                <input type="hidden" name="userId" value={data.user.id} />
                <input type="hidden" name="intent" value="assign" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[#2F1D3B]">Assign Role</p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      Available roles come from the shared catalog and preserve assignedBy traceability.
                    </p>
                  </div>
                  <select name="roleId" className="legal-field" required defaultValue="">
                    <option value="" disabled>
                      Select role
                    </option>
                    {data.rolesPermissions.availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.isSystem ? "· system" : "· custom"} · {role.permissionCount} permissions
                      </option>
                    ))}
                  </select>
                  <input name="reason" placeholder="Reason for assignment" className="legal-field" required />
                  <button type="submit" className="legal-button-primary">
                    Assign Role
                  </button>
                </div>
              </form>

              <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-white p-4">
                <p className="text-sm font-semibold text-[#2F1D3B]">Catalog Surfaces</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  Use dedicated RBAC pages to review the full role catalog and permission matrix before changing access.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/roles" className="legal-button-secondary text-sm">
                    Open Roles
                  </Link>
                  <Link href="/permissions" className="legal-button-secondary text-sm">
                    Open Permissions
                  </Link>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Role Assignments">
            <div className="space-y-3">
              {data.rolesPermissions.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#2F1D3B]">{assignment.roleName}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        assignment.isSystem ? "bg-[#102033] text-white" : "bg-[#E8F4EF] text-[#1B7A5A]"
                      }`}
                    >
                      {assignment.isSystem ? "System" : "Custom"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Assigned {formatDateTime(assignment.assignedAt)} / By {assignment.assignedBy ?? "Unknown actor"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{assignment.roleDescription ?? "No role description stored."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignment.permissionKeys.length ? (
                      assignment.permissionKeys.map((permission) => (
                        <span
                          key={permission}
                          className="rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-1.5 text-xs font-semibold text-[#4C2F5E]"
                        >
                          {permission}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No permissions currently bound to this role.</span>
                    )}
                  </div>
                  <form action={adminUserRoleAssignmentAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <input type="hidden" name="userId" value={data.user.id} />
                    <input type="hidden" name="roleId" value={assignment.roleId} />
                    <input type="hidden" name="intent" value="remove" />
                    <input name="reason" placeholder="Reason for removal" className="legal-field" required />
                    <button type="submit" className="legal-button-primary">
                      Remove Role
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Effective Permissions">
            <div className="flex flex-wrap gap-2">
              {data.rolesPermissions.effectivePermissions.length ? (
                data.rolesPermissions.effectivePermissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-full border border-[#4C2F5E]/12 bg-[#FBF9FD] px-3 py-2 text-sm text-[#4C2F5E]"
                  >
                    {permission}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">No effective permissions resolved from current role assignments.</p>
              )}
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "organizations" ? (
        <Panel title="Organization Memberships">
          <div className="space-y-3">
            {data.organizations.length ? (
              data.organizations.map((organization) => (
                <div key={`${organization.id}-${organization.role}`} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(organization.status)}`}>
                      {prettyText(organization.status)}
                    </span>
                    <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#4C2F5E]">
                      {prettyText(organization.role)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{organization.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Joined {formatDateTime(organization.joinedAt)} / Invited by {organization.invitedBy ?? "Unknown"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {organization.title ?? "No membership title"} / {prettyText(organization.visibility)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">This user has no organization memberships.</p>
            )}
          </div>
        </Panel>
      ) : null}

      {activeTab === "content" ? (
        <div className="space-y-6">
          <Panel title="Recent Discussions">
            <div className="space-y-3">
              {data.content.discussions.length ? (
                data.content.discussions.map((discussion) => (
                  <Link key={discussion.id} href={`/discussions/${discussion.slug}`} className="block rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 transition hover:border-[#4C2F5E]/18">
                    <p className="text-sm font-semibold text-[#2F1D3B]">{discussion.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {prettyText(discussion.status)} / {prettyText(discussion.contentStatus)} / {formatDateTime(discussion.createdAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No discussions authored by this user.</p>
              )}
            </div>
          </Panel>

          <Panel title="Recent Answers">
            <div className="space-y-3">
              {data.content.answers.length ? (
                data.content.answers.map((answer) => (
                  <Link key={answer.id} href={`/discussions/${answer.discussionSlug}`} className="block rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 transition hover:border-[#4C2F5E]/18">
                    <p className="text-sm font-semibold text-[#2F1D3B]">{answer.discussionTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {prettyText(answer.status)} / {answer.isAccepted ? "Accepted answer" : "Standard answer"} / {formatDateTime(answer.createdAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No answers authored by this user.</p>
              )}
            </div>
          </Panel>

          <Panel title="Recent Comments & Cases">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3">
                {data.content.comments.length ? (
                  data.content.comments.map((comment) => (
                    <div key={comment.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-sm text-[#2F1D3B]">{comment.preview}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {prettyText(comment.status)} / {formatDateTime(comment.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No comments authored by this user.</p>
                )}
              </div>

              <div className="space-y-3">
                {data.content.cases.length ? (
                  data.content.cases.map((item) => (
                    <Link key={item.id} href={`/cases/${item.slug}`} className="block rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 transition hover:border-[#4C2F5E]/18">
                      <p className="text-sm font-semibold text-[#2F1D3B]">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {prettyText(item.status)} / {prettyText(item.visibility)} / {formatDateTime(item.createdAt)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No case records authored by this user.</p>
                )}
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "trust" ? (
        <div className="space-y-6">
          <Panel title="Lawyer Profile">
            <DetailGrid
              items={[
                { label: "Bar Council", value: data.trustVerification.lawyerProfile?.barCouncil ?? "Not recorded" },
                { label: "Bar License", value: data.trustVerification.lawyerProfile?.barLicenseNumber ?? "Not recorded" },
                { label: "Firm", value: data.trustVerification.lawyerProfile?.firmName ?? "Not recorded" },
                { label: "Chamber Address", value: data.trustVerification.lawyerProfile?.chamberAddress ?? "Not recorded" },
                { label: "Practice Start Year", value: `${data.trustVerification.lawyerProfile?.practiceStartYear ?? "Not recorded"}` },
                { label: "Verified At", value: formatDateTime(data.trustVerification.lawyerProfile?.verifiedAt ?? null) },
                { label: "Verified By", value: data.trustVerification.lawyerProfile?.verifiedBy ?? "Not recorded" },
              ]}
            />
          </Panel>

          <Panel title="Verification Requests">
            <div className="space-y-3">
              {data.trustVerification.verificationRequests.length ? (
                data.trustVerification.verificationRequests.map((request) => (
                  <div key={request.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(request.status)}`}>
                        {prettyText(request.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#2F1D3B]">
                      Submitted {formatDateTime(request.submittedAt)} / Reviewed {formatDateTime(request.reviewedAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Reviewer {request.reviewedBy ?? "Pending"} / {request.documentCount} documents / Expires {formatDateTime(request.expiresAt)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{request.rejectionReason ?? request.adminNote ?? "No reviewer notes stored."}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No lawyer verification requests are stored for this user.</p>
              )}
            </div>
          </Panel>
        </div>
      ) : null}

      {activeTab === "notifications" ? (
        <Panel title="Recent Notifications">
          <div className="space-y-3">
            {data.notifications.length ? (
              data.notifications.map((notification) => (
                <div key={notification.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(notification.isRead ? "ACTIVE" : "PENDING")}`}>
                      {notification.isRead ? "Read" : "Unread"}
                    </span>
                    <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#4C2F5E]">
                      {prettyText(notification.type)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{notification.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{notification.message ?? "No message body."}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Actor {notification.actor ?? "System"} / {formatDateTime(notification.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No notifications were found for this user.</p>
            )}
          </div>
        </Panel>
      ) : null}

      {activeTab === "audit" ? (
        <Panel title="Audit & Moderation Timeline">
          <div className="space-y-3">
            {data.auditTimeline.length ? (
              data.auditTimeline.map((entry) => (
                <div key={`${entry.source}-${entry.id}`} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#4C2F5E]">
                      {prettyText(entry.source)}
                    </span>
                    <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#4C2F5E]">
                      {prettyText(entry.category)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#2F1D3B]">{entry.action}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Actor {entry.actor ?? "System"} / {formatDateTime(entry.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{entry.reason ?? entry.note ?? "No note recorded."}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No audit or moderation events were found for this user.</p>
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
