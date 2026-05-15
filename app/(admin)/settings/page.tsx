import { adminSessionRevokeAction } from "@/app/actions/admin-security";
import AdminPagination from "@/app/components/admin/AdminPagination";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminSecurityPageData } from "@/lib/services/admin.server";
import { AuditCategory } from "@prisma/client";
import Link from "next/link";

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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatSessionRoles(roles: string[]) {
  if (!roles.length) return "No roles";
  return roles.map((role) => prettyText(role)).join(", ");
}

function formatAuditSummaryLines(summary: string | null) {
  if (!summary) return ["No metadata summary"];
  return summary.split(" / ").filter(Boolean);
}

function buildQueryString(
  filters: {
    q: string;
    category: string;
    failedOnly: string;
    privilegedOnly: string;
    sessionPage: number;
    auditPage: number;
  },
  overrides: Partial<{
    q: string;
    category: string;
    failedOnly: string;
    privilegedOnly: string;
    sessionPage: number;
    auditPage: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.failedOnly === "1") params.set("failedOnly", "1");
  if (next.privilegedOnly === "1") params.set("privilegedOnly", "1");
  if (next.sessionPage > 1) params.set("sessionPage", `${next.sessionPage}`);
  if (next.auditPage > 1) params.set("auditPage", `${next.auditPage}`);

  const query = params.toString();
  return query ? `/settings?${query}` : "/settings";
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-panel p-5 md:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminSecurityPageData({
    q: getFirstParam(resolvedSearchParams.q),
    category: getFirstParam(resolvedSearchParams.category),
    failedOnly: getFirstParam(resolvedSearchParams.failedOnly),
    privilegedOnly: getFirstParam(resolvedSearchParams.privilegedOnly),
    sessionPage: Number.parseInt(getFirstParam(resolvedSearchParams.sessionPage) ?? "1", 10),
    auditPage: Number.parseInt(getFirstParam(resolvedSearchParams.auditPage) ?? "1", 10),
  });
  const sessionVisiblePages = Array.from({ length: data.sessionPagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, data.filters.sessionPage - 3),
    data.filters.sessionPage + 2,
  );
  const auditVisiblePages = Array.from({ length: data.auditPagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, data.filters.auditPage - 3),
    data.filters.auditPage + 2,
  );

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">Audit & Security</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
          Privileged access review, session control, and forensic history.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          This surface is read-mostly by design. Operators can search audit trails, inspect failed login patterns,
          review active privileged sessions, and revoke sessions through audited commands without mutating forensic rows.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Audit Events 24h", value: data.summary.auditEvents24h },
          { label: "Failed Logins 24h", value: data.summary.failedLogins24h },
          { label: "Locked Credentials", value: data.summary.lockedCredentials },
          { label: "Privileged Sessions", value: data.summary.activePrivilegedSessions },
          { label: "Revoked Sessions 24h", value: data.summary.revokedSessions24h },
        ].map((item) => (
          <div key={item.label} className="legal-panel p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#102033]">{item.value}</p>
          </div>
        ))}
      </section>

      <Panel title="Security Filters" description="Apply filters once and inspect sessions, login attempts, and audit rows from the same query state.">
        <form className="grid gap-4 md:grid-cols-4 xl:grid-cols-[1.4fr_0.9fr_auto_auto]">
          <AdminSearchField
            defaultValue={data.filters.q}
            placeholder="Search user, email, IP, device, action"
          />
          <select name="category" defaultValue={data.filters.category} className="legal-field">
            <option value="">All audit categories</option>
            {Object.values(AuditCategory).map((category) => (
              <option key={category} value={category}>
                {prettyText(category)}
              </option>
            ))}
          </select>
          <label className="legal-soft-panel flex items-center gap-2 px-4 py-3 text-sm text-[#2F1D3B]">
            <input type="checkbox" name="failedOnly" value="1" defaultChecked={data.filters.failedOnly === "1"} />
            Failed attempts only
          </label>
          <label className="legal-soft-panel flex items-center gap-2 px-4 py-3 text-sm text-[#2F1D3B]">
            <input type="checkbox" name="privilegedOnly" value="1" defaultChecked={data.filters.privilegedOnly === "1"} />
            Privileged sessions only
          </label>
          <button type="submit" className="legal-button-primary md:col-span-4 xl:col-span-1">
            Apply Filters
          </button>
        </form>
      </Panel>

      <Panel title="Active Sessions" description="Revoke individual sessions with a mandatory reason. Session tokens remain hidden.">
        <div className="legal-table-wrap overflow-hidden">
          <div className="overflow-x-auto">
            <table className="legal-table w-full min-w-[1480px] table-auto">
              <thead>
                <tr>
                  <th className="min-w-[220px] px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="min-w-[130px] px-6 py-4 text-left text-sm font-semibold">Roles</th>
                  <th className="min-w-[180px] px-6 py-4 text-left text-sm font-semibold">Device</th>
                  <th className="min-w-[380px] px-6 py-4 text-left text-sm font-semibold">Network</th>
                  <th className="min-w-[180px] px-6 py-4 text-left text-sm font-semibold">Last Seen</th>
                  <th className="min-w-[180px] px-6 py-4 text-left text-sm font-semibold">Expires</th>
                  <th className="min-w-[260px] px-6 py-4 text-left text-sm font-semibold">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.sessions.length ? (
                  data.sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-6 py-5 align-top">
                        <div className="space-y-2">
                          <Link href={`/user/${session.userId}?tab=security`} className="text-sm font-semibold text-[#2F1D3B] hover:text-[#4C2F5E]">
                            {session.displayName}
                          </Link>
                          <p className="break-words text-sm leading-6 text-slate-600">{session.primaryEmail ?? "No primary email"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-sm leading-6 text-slate-600">{formatSessionRoles(session.roles)}</td>
                      <td className="px-6 py-5 align-top">
                        <div className="space-y-2 text-sm leading-6 text-slate-600">
                          <p className="break-words">{session.deviceLabel ?? "Unlabeled device"}</p>
                          <p className="text-xs leading-6 text-slate-500">Started {formatDateTime(session.createdAt)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="space-y-2 text-sm leading-6 text-slate-600">
                          <p>{session.ip ?? "No IP"}</p>
                          <p className="block min-w-[340px] break-all text-xs leading-6 text-slate-500">
                            {session.userAgent ?? "No user agent"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-sm leading-6 text-slate-600">
                        <span className="whitespace-nowrap">{formatDateTime(session.lastSeenAt)}</span>
                      </td>
                      <td className="px-6 py-5 align-top text-sm leading-6 text-slate-600">
                        <span className="whitespace-nowrap">{formatDateTime(session.expiresAt)}</span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <form action={adminSessionRevokeAction} className="legal-soft-panel space-y-3 p-4">
                          <input type="hidden" name="sessionId" value={session.id} />
                          <input name="reason" placeholder="Reason for revocation" className="legal-field w-full min-w-[220px]" required />
                          <button type="submit" className="legal-button-primary w-full text-sm">
                            Revoke Session
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                      No active sessions match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            start={data.sessionPagination.start}
            end={data.sessionPagination.end}
            total={data.sessionPagination.total}
            currentPage={data.filters.sessionPage}
            pageLinks={sessionVisiblePages.map((pageNumber) => ({
              pageNumber,
              href: buildQueryString(data.filters, { sessionPage: pageNumber }),
            }))}
            previousHref={buildQueryString(data.filters, { sessionPage: Math.max(1, data.filters.sessionPage - 1) })}
            nextHref={buildQueryString(data.filters, {
              sessionPage: Math.min(data.sessionPagination.totalPages, data.filters.sessionPage + 1),
            })}
            isFirstPage={data.filters.sessionPage === 1}
            isLastPage={data.filters.sessionPage === data.sessionPagination.totalPages}
          />
        </div>
      </Panel>

      <Panel title="Audit Timeline" description="Privileged actions, moderation operations, and platform security events remain append-only.">
        <div className="legal-table-wrap overflow-hidden">
          <div className="overflow-x-auto">
            <table className="legal-table min-w-full table-auto">
              <thead>
                <tr>
                  <th className="min-w-[190px] px-6 py-4 text-left text-sm font-semibold">Action</th>
                  <th className="min-w-[140px] px-6 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="min-w-[120px] px-6 py-4 text-left text-sm font-semibold">Actor</th>
                  <th className="min-w-[150px] px-6 py-4 text-left text-sm font-semibold">Target</th>
                  <th className="min-w-[360px] px-6 py-4 text-left text-sm font-semibold">Summary</th>
                  <th className="min-w-[190px] px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.auditRows.length ? (
                  data.auditRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-6 py-4 align-top text-sm font-semibold leading-6 text-[#2F1D3B]">{row.action}</td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <span className="workspace-pill">
                            {prettyText(row.category)}
                          </span>
                          {row.targetType ? (
                            <span className="workspace-pill">
                              {prettyText(row.targetType)}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">
                        <span className="block break-words">{row.actorName ?? "System"}</span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        {row.targetUserId ? (
                          <Link href={`/user/${row.targetUserId}?tab=audit`} className="block break-words text-sm font-semibold leading-6 text-[#4C2F5E] hover:text-[#2F1D3B]">
                            {row.targetUserName ?? "Open target audit"}
                          </Link>
                        ) : (
                          <span className="block break-words text-sm leading-6 text-slate-600">{row.targetUserName ?? "Not linked"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex max-w-[420px] flex-wrap gap-x-4 gap-y-1">
                          {formatAuditSummaryLines(row.metaSummary).map((line, index) => (
                            <p key={`${row.id}-${index}`} className="whitespace-normal break-all text-sm leading-6 text-slate-600">
                              {line}
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-sm leading-6 text-slate-600">
                        <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      No audit rows match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            start={data.auditPagination.start}
            end={data.auditPagination.end}
            total={data.auditPagination.total}
            currentPage={data.filters.auditPage}
            pageLinks={auditVisiblePages.map((pageNumber) => ({
              pageNumber,
              href: buildQueryString(data.filters, { auditPage: pageNumber }),
            }))}
            previousHref={buildQueryString(data.filters, { auditPage: Math.max(1, data.filters.auditPage - 1) })}
            nextHref={buildQueryString(data.filters, {
              auditPage: Math.min(data.auditPagination.totalPages, data.filters.auditPage + 1),
            })}
            isFirstPage={data.filters.auditPage === 1}
            isLastPage={data.filters.auditPage === data.auditPagination.totalPages}
          />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Locked Credentials" description="Credential rows stay immutable except for system login workflows. This list is for triage and drill-down only.">
          <div className="space-y-3">
            {data.lockedCredentialsRows.length ? (
              data.lockedCredentialsRows.map((row) => (
                <Link key={row.userId} href={`/user/${row.userId}?tab=security`} className="legal-soft-panel block p-4 transition hover:border-[#4C2F5E]/18">
                  <p className="text-sm font-semibold text-[#2F1D3B]">{row.displayName}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    {row.primaryEmail ?? "No primary email"} / {row.failedAttempts} failed attempts
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Locked until {formatDateTime(row.lockedUntil)}</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">No credentials are currently locked.</p>
            )}
          </div>
        </Panel>

        <Panel title="Recent Login Attempts" description="This list supports incident triage without exposing tokens, secrets, or raw MFA material.">
          <div className="space-y-3">
            {data.loginAttemptRows.length ? (
              data.loginAttemptRows.map((attempt) => (
                <div key={attempt.id} className="legal-soft-panel p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attempt.success ? "bg-[#E8F4EF] text-[#1B7A5A]" : "bg-[#FCE8E6] text-[#A33A31]"}`}>
                      {attempt.success ? "Success" : "Failed"}
                    </span>
                    {attempt.userId ? (
                      <Link href={`/user/${attempt.userId}?tab=security`} className="text-xs font-semibold text-[#4C2F5E] hover:text-[#2F1D3B]">
                        {attempt.displayName ?? "Linked user"}
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[#2F1D3B]">{attempt.identifierValue ?? attempt.primaryEmail ?? "No identifier captured"}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    {attempt.failureReason ?? "No failure reason"} / {formatDateTime(attempt.createdAt)}
                  </p>
                  <p className="text-xs leading-6 text-slate-500">{attempt.userAgent ?? "No user agent"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No login attempts match the current filters.</p>
            )}
          </div>
        </Panel>

        <Panel title="Operational Gap Notes" description="These controls are intentionally not pretending to be implemented when the schema does not back them yet.">
          <div className="space-y-3 text-sm leading-7 text-slate-600">
            <p>Feature flags, maintenance mode, provider toggles, and job dashboards still need a dedicated configuration or job subsystem outside the current Prisma schema.</p>
            <p>This page stays focused on schema-backed security truth: sessions, credentials, login attempts, and immutable audit history.</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
