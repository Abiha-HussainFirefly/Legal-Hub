import { adminUserLifecycleAction } from "@/app/actions/admin-users";
import { adminUserRoleAssignmentAction } from "@/app/actions/admin-rbac";
import AdminPagination from "@/app/components/admin/AdminPagination";
import type { AdminUserDetailData } from "@/lib/services/admin.server";
import Link from "next/link";

type UserTabKey =
  | "overview"
  | "profile"
  | "security"
  | "identifiers"
  | "roles"
  | "organizations"
  | "content"
  | "trust"
  | "notifications"
  | "audit";

interface AdminUserDetailSectionsProps {
  userId: string;
  activeTab: UserTabKey;
  searchParams: Record<string, string | string[] | undefined>;
  data: AdminUserDetailData;
}

interface SectionState {
  q: string;
  filter: string;
  page: number;
}

interface DataTableRow {
  key: string;
  searchableText: string;
  filterValue?: string;
  cells: React.ReactNode[];
}

interface DataTableSectionProps {
  userId: string;
  activeTab: UserTabKey;
  searchParams: Record<string, string | string[] | undefined>;
  sectionKey: string;
  title: string;
  description?: string;
  columns: string[];
  rows: DataTableRow[];
  emptyMessage: string;
  searchPlaceholder: string;
  filterOptions?: Array<{ value: string; label: string }>;
  minWidthClass?: string;
  columnClassNames?: string[];
  cellClassNames?: string[];
}

const DEFAULT_PAGE_SIZE = 5;

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

function formatDateTime(value: Date | string | null) {
  if (!value) return "Not available";

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
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

function badgeClass(tone: "neutral" | "outline" | "status", status?: string) {
  if (tone === "status" && status) {
    return `rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`;
  }

  if (tone === "outline") {
    return "rounded-full border border-[#4C2F5E]/12 bg-white px-2.5 py-1 text-xs font-semibold text-[#4C2F5E]";
  }

  return "rounded-full bg-[#EEF2F7] px-2.5 py-1 text-xs font-semibold text-[#36506E]";
}

function LongTextCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 whitespace-normal break-words leading-7 ${className}`.trim()}>{children}</div>;
}

function DateTimeCell({ value, className = "" }: { value: Date | string | null; className?: string }) {
  return <span className={`inline-block whitespace-nowrap ${className}`.trim()}>{formatDateTime(value)}</span>;
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

function KeyValueTable({
  userId,
  activeTab,
  searchParams,
  sectionKey,
  rows,
}: {
  userId: string;
  activeTab: UserTabKey;
  searchParams: Record<string, string | string[] | undefined>;
  sectionKey: string;
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  const state = getSectionState(searchParams, sectionKey);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const currentPage = Math.min(state.page, totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const endIndex = total === 0 ? 0 : Math.min(startIndex + DEFAULT_PAGE_SIZE, total);
  const paginatedRows = rows.slice(startIndex, endIndex);
  const start = total === 0 ? 0 : startIndex + 1;
  const pageLinks = buildVisiblePages(totalPages, currentPage).map((pageNumber) => ({
    pageNumber,
    href: buildSectionHref(userId, activeTab, sectionKey, state, { page: pageNumber }),
  }));

  return (
    <div className="legal-table-wrap overflow-hidden">
      <div className="overflow-x-auto">
        <table className="legal-table w-full min-w-[560px] table-fixed">
          <thead>
            <tr>
              <th className="w-[240px] px-6 py-4 text-left text-sm font-semibold">Field</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRows.map((row) => (
              <tr key={row.label}>
                <td className="px-6 py-4 align-top text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">
                  {row.label}
                </td>
                <td className="px-6 py-4 align-top text-sm text-[#2F1D3B]">
                  <LongTextCell>{row.value}</LongTextCell>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > DEFAULT_PAGE_SIZE ? (
        <AdminPagination
          start={start}
          end={endIndex}
          total={total}
          currentPage={currentPage}
          pageLinks={pageLinks}
          previousHref={buildSectionHref(userId, activeTab, sectionKey, state, { page: Math.max(1, currentPage - 1) })}
          nextHref={buildSectionHref(
            userId,
            activeTab,
            sectionKey,
            state,
            { page: Math.min(totalPages, currentPage + 1) },
          )}
          isFirstPage={currentPage === 1}
          isLastPage={currentPage === totalPages}
        />
      ) : null}
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

function getSectionState(
  searchParams: Record<string, string | string[] | undefined>,
  sectionKey: string,
): SectionState {
  const q = getFirstParam(searchParams[`${sectionKey}Q`])?.trim() ?? "";
  const filter = getFirstParam(searchParams[`${sectionKey}Filter`])?.trim() ?? "";
  const parsedPage = Number.parseInt(getFirstParam(searchParams[`${sectionKey}Page`]) ?? "1", 10);

  return {
    q,
    filter,
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  };
}

function buildSectionHref(
  userId: string,
  activeTab: UserTabKey,
  sectionKey: string,
  state: SectionState,
  overrides: Partial<SectionState> = {},
) {
  const params = new URLSearchParams();
  const next = { ...state, ...overrides };

  params.set("tab", activeTab);
  if (next.q) params.set(`${sectionKey}Q`, next.q);
  if (next.filter) params.set(`${sectionKey}Filter`, next.filter);
  if (next.page > 1) params.set(`${sectionKey}Page`, `${next.page}`);

  return `/user/${userId}?${params.toString()}`;
}

function buildVisiblePages(totalPages: number, currentPage: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    pages.push(pageNumber);
  }

  return pages;
}

function DataTableSection({
  userId,
  activeTab,
  searchParams,
  sectionKey,
  title,
  description,
  columns,
  rows,
  emptyMessage,
  searchPlaceholder,
  filterOptions = [],
  minWidthClass = "min-w-[980px]",
  columnClassNames = [],
  cellClassNames = [],
}: DataTableSectionProps) {
  const state = getSectionState(searchParams, sectionKey);
  const query = state.q.toLowerCase();

  const filteredRows = rows.filter((row) => {
    const matchesQuery = !query || row.searchableText.toLowerCase().includes(query);
    const matchesFilter = !state.filter || row.filterValue === state.filter;
    return matchesQuery && matchesFilter;
  });

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const currentPage = Math.min(state.page, totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const endIndex = total === 0 ? 0 : Math.min(startIndex + DEFAULT_PAGE_SIZE, total);
  const paginatedRows = filteredRows.slice(startIndex, endIndex);
  const start = total === 0 ? 0 : startIndex + 1;
  const pageLinks = buildVisiblePages(totalPages, currentPage).map((pageNumber) => ({
    pageNumber,
    href: buildSectionHref(userId, activeTab, sectionKey, state, { page: pageNumber }),
  }));

  return (
    <Panel title={title} description={description}>
      <form className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
        <input type="hidden" name="tab" value={activeTab} />
        <input
          type="text"
          name={`${sectionKey}Q`}
          defaultValue={state.q}
          placeholder={searchPlaceholder}
          className="legal-field"
        />
        {filterOptions.length ? (
          <select name={`${sectionKey}Filter`} defaultValue={state.filter} className="legal-field">
            <option value="">All filters</option>
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div />
        )}
        <button type="submit" className="legal-button-primary w-full xl:w-auto">
          Apply
        </button>
        <Link href={`/user/${userId}?tab=${activeTab}`} className="legal-button-secondary w-full xl:w-auto">
          Reset
        </Link>
      </form>

      <div className="legal-table-wrap overflow-hidden">
        <div className="overflow-x-auto pb-1">
          <table className={`legal-table w-full table-auto ${minWidthClass}`}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column}
                  className={`px-6 py-4 text-left text-sm font-semibold whitespace-normal ${columnClassNames[index] ?? ""}`.trim()}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRows.length ? (
              paginatedRows.map((row) => (
                <tr key={row.key}>
                  {row.cells.map((cell, index) => (
                    <td
                      key={`${row.key}-${index}`}
                      className={`min-w-0 px-6 py-4 align-top text-sm whitespace-normal break-words text-slate-600 ${cellClassNames[index] ?? ""}`.trim()}
                    >
                      <LongTextCell>{cell}</LongTextCell>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        <AdminPagination
          start={start}
          end={endIndex}
          total={total}
          currentPage={currentPage}
          pageLinks={pageLinks}
          previousHref={buildSectionHref(userId, activeTab, sectionKey, state, { page: Math.max(1, currentPage - 1) })}
          nextHref={buildSectionHref(
            userId,
            activeTab,
            sectionKey,
            state,
            { page: Math.min(totalPages, currentPage + 1) },
          )}
          isFirstPage={currentPage === 1}
          isLastPage={currentPage === totalPages}
        />
      </div>
    </Panel>
  );
}

export default function AdminUserDetailSections({
  userId,
  activeTab,
  searchParams,
  data,
}: AdminUserDetailSectionsProps) {
  if (activeTab === "overview") {
    return (
      <div className="space-y-6">
        <Panel title="Identity Summary">
          <KeyValueTable
            userId={userId}
            activeTab={activeTab}
            searchParams={searchParams}
            sectionKey="overviewIdentity"
            rows={[
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
            <ActionForm
              userId={userId}
              intent="suspend"
              title="Suspend Account"
              description="Use for temporary platform access suspension. Active sessions are revoked."
            />
            <ActionForm
              userId={userId}
              intent="disable"
              title="Disable Account"
              description="Use for hard operational disablement. Active sessions are revoked."
            />
            <ActionForm
              userId={userId}
              intent="restore"
              title="Restore Account"
              description="Return the account to ACTIVE and clear deleted state if present."
            />
            <ActionForm
              userId={userId}
              intent="soft_delete"
              title="Soft Delete Account"
              description="Marks the account deleted without destroying forensic data."
            />
            <ActionForm
              userId={userId}
              intent="revoke_sessions"
              title="Revoke Active Sessions"
              description="Revokes all active sessions for this user immediately."
              reasonRequired={false}
            />
          </div>
        </Panel>
      </div>
    );
  }

  if (activeTab === "profile") {
    return (
      <div className="space-y-6">
        <Panel title="Public Profile">
          <KeyValueTable
            userId={userId}
            activeTab={activeTab}
            searchParams={searchParams}
            sectionKey="profilePublic"
            rows={[
              { label: "Bio", value: data.user.bio ?? "No bio" },
              { label: "City", value: data.user.city ?? "No city" },
              { label: "Country", value: data.user.countryCode ?? "No country" },
              { label: "Website", value: data.profile.websiteUrl ?? "No website" },
              { label: "LinkedIn", value: data.profile.linkedInUrl ?? "No LinkedIn URL" },
              {
                label: "Completion",
                value: `${data.profile.completionPercentage}% / ${prettyText(data.profile.completionState)}`,
              },
            ]}
          />
        </Panel>

        <Panel title="Trust Signals">
          <KeyValueTable
            userId={userId}
            activeTab={activeTab}
            searchParams={searchParams}
            sectionKey="profileTrust"
            rows={[
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

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="badges"
          title="Awarded Badges"
          columns={["Badge", "Code", "Awarded At", "Awarded By", "Reason"]}
          rows={data.profile.badges.map((badge) => ({
            key: badge.id,
            searchableText: [badge.name, badge.code, badge.awardedBy ?? "", badge.reason ?? ""].join(" "),
            cells: [
              <span key="name" className="font-semibold text-[#2F1D3B]">
                {badge.name}
              </span>,
              badge.code,
              formatDateTime(badge.awardedAt),
              badge.awardedBy ?? "System",
              badge.reason ?? "No award reason stored.",
            ],
          }))}
          emptyMessage="No badges have been awarded to this user."
          searchPlaceholder="Search badge name, code, awarder, or reason"
          minWidthClass="min-w-[920px]"
        />
      </div>
    );
  }

  if (activeTab === "security") {
    return (
      <div className="space-y-6">
        <Panel title="Credential & Recovery">
          <KeyValueTable
            userId={userId}
            activeTab={activeTab}
            searchParams={searchParams}
            sectionKey="securityCredential"
            rows={[
              { label: "Password Set", value: formatDateTime(data.security.credential?.passwordSetAt ?? null) },
              { label: "Must Rotate", value: data.security.credential?.mustRotate ? "Yes" : "No" },
              { label: "Failed Attempts", value: `${data.security.credential?.failedAttempts ?? 0}` },
              { label: "Locked Until", value: formatDateTime(data.security.credential?.lockedUntil ?? null) },
              { label: "Recovery Codes Total", value: `${data.security.recoveryCodes.total}` },
              { label: "Recovery Codes Consumed", value: `${data.security.recoveryCodes.consumed}` },
              { label: "Recovery Codes Remaining", value: `${data.security.recoveryCodes.remaining}` },
              { label: "Last Known IP", value: data.user.lastLoginIp ?? "Not recorded" },
              { label: "Last Known User Agent", value: data.user.lastUserAgent ?? "Not recorded" },
            ]}
          />
        </Panel>

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="mfa"
          title="MFA Factors"
          columns={["Label", "Type", "Status", "Last Used", "Created"]}
          rows={data.security.mfaFactors.map((factor) => ({
            key: factor.id,
            searchableText: [factor.label ?? "", factor.type, factor.status].join(" "),
            filterValue: factor.status,
            cells: [
              <span key="label" className="font-semibold text-[#2F1D3B]">
                {factor.label ?? "Unlabeled factor"}
              </span>,
              <span key="type" className={badgeClass("outline")}>
                {prettyText(factor.type)}
              </span>,
              <span key="status" className={badgeClass("status", factor.status)}>
                {prettyText(factor.status)}
              </span>,
              formatDateTime(factor.lastUsedAt),
              formatDateTime(factor.createdAt),
            ],
          }))}
          emptyMessage="No MFA factors are enrolled."
          searchPlaceholder="Search factor label, type, or status"
          filterOptions={[
            { value: "ACTIVE", label: "Active" },
            { value: "DISABLED", label: "Disabled" },
            { value: "PENDING", label: "Pending" },
          ]}
        />

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="sessions"
          title="Recent Sessions"
          columns={["Device", "State", "Last Seen", "Expires", "Network", "Revoke Reason"]}
          rows={data.security.sessions.map((session) => {
            const state = session.revokedAt ? "REVOKED" : "ACTIVE";

            return {
              key: session.id,
              searchableText: [
                session.deviceLabel ?? "",
                session.ip ?? "",
                session.userAgent ?? "",
                session.revokeReason ?? "",
                state,
              ].join(" "),
              filterValue: state,
              cells: [
                <div key="device" className="space-y-1">
                  <p className="font-semibold text-[#2F1D3B]">{session.deviceLabel ?? "Unlabeled device"}</p>
                  <p className="text-xs text-slate-500">{session.userAgent ?? "No user agent"}</p>
                </div>,
                <span key="state" className={badgeClass("status", state === "ACTIVE" ? "ACTIVE" : "DISABLED")}>
                  {state === "ACTIVE" ? "Active" : "Revoked"}
                </span>,
                formatDateTime(session.lastSeenAt),
                formatDateTime(session.expiresAt),
                session.ip ?? "No IP",
                <LongTextCell key="revokeReason" className="min-w-[160px]">
                  {session.revokeReason ?? "None"}
                </LongTextCell>,
              ],
            };
          })}
          emptyMessage="No sessions recorded."
          searchPlaceholder="Search device, IP, user agent, or revoke reason"
          filterOptions={[
            { value: "ACTIVE", label: "Active" },
            { value: "REVOKED", label: "Revoked" },
          ]}
          minWidthClass="min-w-[1360px]"
        />

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="attempts"
          title="Login Attempts"
          columns={["Result", "Identifier", "Failure Reason", "User Agent", "Created"]}
          rows={data.security.loginAttempts.map((attempt) => ({
            key: attempt.id,
            searchableText: [
              attempt.identifierValue ?? "",
              attempt.failureReason ?? "",
              attempt.userAgent ?? "",
              attempt.success ? "SUCCESS" : "FAILED",
            ].join(" "),
            filterValue: attempt.success ? "SUCCESS" : "FAILED",
            cells: [
              <span
                key="result"
                className={badgeClass("status", attempt.success ? "ACTIVE" : "DISABLED")}
              >
                {attempt.success ? "Success" : "Failed"}
              </span>,
              attempt.identifierValue ?? "No identifier captured",
              attempt.failureReason ?? "No failure reason",
              attempt.userAgent ?? "No user agent",
              formatDateTime(attempt.createdAt),
            ],
          }))}
          emptyMessage="No login attempts were found."
          searchPlaceholder="Search identifier, failure reason, or user agent"
          filterOptions={[
            { value: "SUCCESS", label: "Success" },
            { value: "FAILED", label: "Failed" },
          ]}
          minWidthClass="min-w-[1120px]"
        />
      </div>
    );
  }

  if (activeTab === "identifiers") {
    return (
      <DataTableSection
        userId={userId}
        activeTab={activeTab}
        searchParams={searchParams}
        sectionKey="identifiers"
        title="Identifiers"
        columns={["Value", "Type", "Primary", "Verified", "Added"]}
        rows={data.identifiers.map((identifier) => ({
          key: identifier.id,
          searchableText: [identifier.value, identifier.type, identifier.isPrimary ? "PRIMARY" : ""].join(" "),
          filterValue: identifier.type,
          cells: [
            <span key="value" className="break-all font-semibold text-[#2F1D3B]">
              {identifier.value}
            </span>,
            <span key="type" className={badgeClass("outline")}>
              {prettyText(identifier.type)}
            </span>,
            identifier.isPrimary ? "Yes" : "No",
            formatDateTime(identifier.verifiedAt),
            formatDateTime(identifier.createdAt),
          ],
        }))}
        emptyMessage="No identifiers are stored for this user."
        searchPlaceholder="Search identifier value or type"
        filterOptions={Array.from(new Set(data.identifiers.map((identifier) => identifier.type))).map((value) => ({
          value,
          label: prettyText(value),
        }))}
      />
    );
  }

  if (activeTab === "roles") {
    return (
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
                      {role.name} - {role.isSystem ? "system" : "custom"} - {role.permissionCount} permissions
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

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="roleAssignments"
          title="Role Assignments"
          columns={["Role", "Kind", "Assigned", "Assigned By", "Permissions", "Description", "Action"]}
          rows={data.rolesPermissions.assignments.map((assignment) => ({
            key: assignment.id,
            searchableText: [
              assignment.roleName,
              assignment.roleDescription ?? "",
              assignment.assignedBy ?? "",
              assignment.permissionKeys.join(" "),
            ].join(" "),
            filterValue: assignment.isSystem ? "system" : "custom",
            cells: [
              <span key="role" className="font-semibold text-[#2F1D3B]">
                {assignment.roleName}
              </span>,
              <span key="kind" className={assignment.isSystem ? badgeClass("status", "ACTIVE") : badgeClass("outline")}>
                {assignment.isSystem ? "System" : "Custom"}
              </span>,
              <DateTimeCell key="assignedAt" value={assignment.assignedAt} />,
              <LongTextCell key="assignedBy" className="min-w-[160px]">
                {assignment.assignedBy ?? "Unknown actor"}
              </LongTextCell>,
              assignment.permissionKeys.length ? (
                <div key="permissions" className="grid w-full min-w-0 gap-2 sm:grid-cols-2">
                  {assignment.permissionKeys.map((permissionKey) => (
                    <span
                      key={permissionKey}
                      className="rounded-full border border-[#4C2F5E]/12 bg-[#FBF9FD] px-2.5 py-1 font-mono text-[11px] text-[#4C2F5E] break-all"
                    >
                      {permissionKey}
                    </span>
                  ))}
                </div>
              ) : (
                "No permissions bound"
              ),
              <LongTextCell key="description">{assignment.roleDescription ?? "No role description stored."}</LongTextCell>,
              <form key="action" action={adminUserRoleAssignmentAction} className="grid gap-2">
                <input type="hidden" name="userId" value={data.user.id} />
                <input type="hidden" name="roleId" value={assignment.roleId} />
                <input type="hidden" name="intent" value="remove" />
                <input name="reason" placeholder="Reason for removal" className="legal-field w-full min-w-[280px]" required />
                <button type="submit" className="legal-button-primary w-full text-sm">
                  Remove Role
                </button>
              </form>,
            ],
          }))}
          emptyMessage="No role assignments are recorded for this user."
          searchPlaceholder="Search role, permission, description, or actor"
          filterOptions={[
            { value: "system", label: "System roles" },
            { value: "custom", label: "Custom roles" },
          ]}
          minWidthClass="min-w-[1680px]"
          columnClassNames={[
            "min-w-[120px]",
            "min-w-[110px]",
            "min-w-[180px]",
            "min-w-[180px]",
            "min-w-[520px]",
            "min-w-[260px]",
            "min-w-[260px]",
          ]}
          cellClassNames={[
            "min-w-[120px]",
            "min-w-[110px]",
            "min-w-[180px]",
            "min-w-[180px]",
            "min-w-[520px]",
            "min-w-[260px]",
            "min-w-[260px]",
          ]}
        />

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="permissions"
          title="Effective Permissions"
          columns={["Permission Key"]}
          rows={data.rolesPermissions.effectivePermissions.map((permission) => ({
            key: permission,
            searchableText: permission,
            cells: [<span key="permission" className="font-mono text-xs text-[#2F1D3B]">{permission}</span>],
          }))}
          emptyMessage="No effective permissions resolved from current role assignments."
          searchPlaceholder="Search permission key"
          minWidthClass="min-w-[560px]"
        />
      </div>
    );
  }

  if (activeTab === "organizations") {
    return (
      <DataTableSection
        userId={userId}
        activeTab={activeTab}
        searchParams={searchParams}
        sectionKey="organizations"
        title="Organization Memberships"
        columns={["Organization", "Role", "Status", "Title", "Visibility", "Joined", "Invited By"]}
        rows={data.organizations.map((organization) => ({
          key: `${organization.id}-${organization.role}`,
          searchableText: [
            organization.name,
            organization.role,
            organization.status,
            organization.title ?? "",
            organization.visibility,
            organization.invitedBy ?? "",
          ].join(" "),
          filterValue: organization.status,
          cells: [
            <div key="org" className="space-y-1">
              <p className="font-semibold text-[#2F1D3B]">{organization.name}</p>
              <p className="text-xs text-slate-500">{organization.slug}</p>
            </div>,
            <span key="role" className={badgeClass("outline")}>
              {prettyText(organization.role)}
            </span>,
            <span key="status" className={badgeClass("status", organization.status)}>
              {prettyText(organization.status)}
            </span>,
            organization.title ?? "No membership title",
            prettyText(organization.visibility),
            formatDateTime(organization.joinedAt),
            organization.invitedBy ?? "Unknown",
          ],
        }))}
        emptyMessage="This user has no organization memberships."
        searchPlaceholder="Search organization, role, title, or inviter"
        filterOptions={Array.from(new Set(data.organizations.map((organization) => organization.status))).map((value) => ({
          value,
          label: prettyText(value),
        }))}
        minWidthClass="min-w-[1220px]"
      />
    );
  }

  if (activeTab === "content") {
    return (
      <div className="space-y-6">
        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="discussions"
          title="Recent Discussions"
          columns={["Title", "Status", "Content Status", "Created", "Open"]}
          rows={data.content.discussions.map((discussion) => ({
            key: discussion.id,
            searchableText: [discussion.title, discussion.status, discussion.contentStatus].join(" "),
            filterValue: discussion.status,
            cells: [
              <span key="title" className="font-semibold text-[#2F1D3B]">
                {discussion.title}
              </span>,
              <span key="status" className={badgeClass("status", discussion.status)}>
                {prettyText(discussion.status)}
              </span>,
              <span key="contentStatus" className={badgeClass("outline")}>
                {prettyText(discussion.contentStatus)}
              </span>,
              <DateTimeCell key="createdAt" value={discussion.createdAt} />,
              <Link
                key="open"
                href={`/discussions/${discussion.slug}`}
                className="legal-button-secondary inline-flex min-w-[88px] justify-center text-center text-sm whitespace-nowrap"
              >
                Open
              </Link>,
            ],
          }))}
          emptyMessage="No discussions authored by this user."
          searchPlaceholder="Search discussion title or status"
          filterOptions={Array.from(new Set(data.content.discussions.map((discussion) => discussion.status))).map((value) => ({
            value,
            label: prettyText(value),
          }))}
          minWidthClass="min-w-[1160px]"
          columnClassNames={["min-w-[500px]", "min-w-[110px]", "min-w-[130px]", "min-w-[210px]", "min-w-[96px]"]}
          cellClassNames={["min-w-[500px]", "min-w-[110px]", "min-w-[130px]", "min-w-[210px]", "min-w-[96px]"]}
        />

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="answers"
          title="Recent Answers"
          columns={["Discussion", "Status", "Accepted", "Created", "Open"]}
          rows={data.content.answers.map((answer) => ({
            key: answer.id,
            searchableText: [answer.discussionTitle, answer.status, answer.isAccepted ? "accepted" : ""].join(" "),
            filterValue: answer.status,
            cells: [
              <span key="discussion" className="font-semibold text-[#2F1D3B]">
                {answer.discussionTitle}
              </span>,
              <span key="status" className={badgeClass("status", answer.status)}>
                {prettyText(answer.status)}
              </span>,
              answer.isAccepted ? "Yes" : "No",
              <DateTimeCell key="createdAt" value={answer.createdAt} />,
              <Link
                key="open"
                href={`/discussions/${answer.discussionSlug}`}
                className="legal-button-secondary inline-flex min-w-[88px] justify-center text-center text-sm whitespace-nowrap"
              >
                Open
              </Link>,
            ],
          }))}
          emptyMessage="No answers authored by this user."
          searchPlaceholder="Search discussion title or answer status"
          filterOptions={Array.from(new Set(data.content.answers.map((answer) => answer.status))).map((value) => ({
            value,
            label: prettyText(value),
          }))}
          minWidthClass="min-w-[1120px]"
          columnClassNames={["min-w-[480px]", "min-w-[110px]", "min-w-[100px]", "min-w-[210px]", "min-w-[96px]"]}
          cellClassNames={["min-w-[480px]", "min-w-[110px]", "min-w-[100px]", "min-w-[210px]", "min-w-[96px]"]}
        />

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="comments"
          title="Recent Comments"
          columns={["Preview", "Status", "Created"]}
          rows={data.content.comments.map((comment) => ({
            key: comment.id,
            searchableText: [comment.preview, comment.status].join(" "),
            filterValue: comment.status,
            cells: [
              <span key="preview" className="text-[#2F1D3B]">
                {comment.preview}
              </span>,
              <span key="status" className={badgeClass("status", comment.status)}>
                {prettyText(comment.status)}
              </span>,
              <DateTimeCell key="createdAt" value={comment.createdAt} />,
            ],
          }))}
          emptyMessage="No comments authored by this user."
          searchPlaceholder="Search comment preview or status"
          filterOptions={Array.from(new Set(data.content.comments.map((comment) => comment.status))).map((value) => ({
            value,
            label: prettyText(value),
          }))}
          minWidthClass="min-w-[880px]"
        />

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="cases"
          title="Recent Cases"
          columns={["Title", "Status", "Visibility", "Created", "Open"]}
          rows={data.content.cases.map((item) => ({
            key: item.id,
            searchableText: [item.title, item.status, item.visibility].join(" "),
            filterValue: item.status,
            cells: [
              <span key="title" className="font-semibold text-[#2F1D3B]">
                {item.title}
              </span>,
              <span key="status" className={badgeClass("status", item.status)}>
                {prettyText(item.status)}
              </span>,
              <span key="visibility" className={badgeClass("outline")}>
                {prettyText(item.visibility)}
              </span>,
              <DateTimeCell key="createdAt" value={item.createdAt} />,
              <Link
                key="open"
                href={`/cases/${item.slug}`}
                className="legal-button-secondary inline-flex min-w-[88px] justify-center text-center text-sm whitespace-nowrap"
              >
                Open
              </Link>,
            ],
          }))}
          emptyMessage="No case records authored by this user."
          searchPlaceholder="Search case title, status, or visibility"
          filterOptions={Array.from(new Set(data.content.cases.map((item) => item.status))).map((value) => ({
            value,
            label: prettyText(value),
          }))}
          minWidthClass="min-w-[1180px]"
          columnClassNames={["min-w-[520px]", "min-w-[140px]", "min-w-[110px]", "min-w-[210px]", "min-w-[96px]"]}
          cellClassNames={["min-w-[520px]", "min-w-[140px]", "min-w-[110px]", "min-w-[210px]", "min-w-[96px]"]}
        />
      </div>
    );
  }

  if (activeTab === "trust") {
    return (
      <div className="space-y-6">
        <Panel title="Lawyer Profile">
          <KeyValueTable
            userId={userId}
            activeTab={activeTab}
            searchParams={searchParams}
            sectionKey="trustLawyerProfile"
            rows={[
              { label: "Bar Council", value: data.trustVerification.lawyerProfile?.barCouncil ?? "Not recorded" },
              {
                label: "Bar License",
                value: data.trustVerification.lawyerProfile?.barLicenseNumber ?? "Not recorded",
              },
              { label: "Firm", value: data.trustVerification.lawyerProfile?.firmName ?? "Not recorded" },
              {
                label: "Chamber Address",
                value: data.trustVerification.lawyerProfile?.chamberAddress ?? "Not recorded",
              },
              {
                label: "Practice Start Year",
                value: `${data.trustVerification.lawyerProfile?.practiceStartYear ?? "Not recorded"}`,
              },
              {
                label: "Verification Status",
                value: prettyText(data.trustVerification.lawyerProfile?.verificationStatus ?? null),
              },
              {
                label: "Verified At",
                value: formatDateTime(data.trustVerification.lawyerProfile?.verifiedAt ?? null),
              },
              { label: "Verified By", value: data.trustVerification.lawyerProfile?.verifiedBy ?? "Not recorded" },
            ]}
          />
        </Panel>

        <DataTableSection
          userId={userId}
          activeTab={activeTab}
          searchParams={searchParams}
          sectionKey="verificationRequests"
          title="Verification Requests"
          columns={["Status", "Submitted", "Reviewed", "Reviewer", "Documents", "Expires", "Notes"]}
          rows={data.trustVerification.verificationRequests.map((request) => ({
            key: request.id,
            searchableText: [
              request.status,
              request.reviewedBy ?? "",
              request.rejectionReason ?? "",
              request.adminNote ?? "",
            ].join(" "),
            filterValue: request.status,
            cells: [
              <span key="status" className={badgeClass("status", request.status)}>
                {prettyText(request.status)}
              </span>,
              formatDateTime(request.submittedAt),
              formatDateTime(request.reviewedAt),
              <LongTextCell key="reviewedBy" className="min-w-[160px]">
                {request.reviewedBy ?? "Pending"}
              </LongTextCell>,
              `${request.documentCount}`,
              formatDateTime(request.expiresAt),
              <LongTextCell key="notes" className="min-w-[320px]">
                {request.rejectionReason ?? request.adminNote ?? "No reviewer notes stored."}
              </LongTextCell>,
            ],
          }))}
          emptyMessage="No lawyer verification requests are stored for this user."
          searchPlaceholder="Search reviewer or notes"
          filterOptions={Array.from(
            new Set(data.trustVerification.verificationRequests.map((request) => request.status)),
          ).map((value) => ({
            value,
            label: prettyText(value),
          }))}
          minWidthClass="min-w-[1460px]"
        />
      </div>
    );
  }

  if (activeTab === "notifications") {
    return (
      <DataTableSection
        userId={userId}
        activeTab={activeTab}
        searchParams={searchParams}
        sectionKey="notifications"
        title="Recent Notifications"
        columns={["Title", "Type", "Read State", "Actor", "Created", "Message"]}
        rows={data.notifications.map((notification) => ({
          key: notification.id,
          searchableText: [
            notification.title,
            notification.type,
            notification.actor ?? "",
            notification.message ?? "",
            notification.isRead ? "READ" : "UNREAD",
          ].join(" "),
          filterValue: notification.isRead ? "READ" : "UNREAD",
          cells: [
            <span key="title" className="font-semibold text-[#2F1D3B]">
              {notification.title}
            </span>,
            <span key="type" className={badgeClass("outline")}>
              {prettyText(notification.type)}
            </span>,
            <span key="state" className={badgeClass("status", notification.isRead ? "ACTIVE" : "PENDING")}>
              {notification.isRead ? "Read" : "Unread"}
            </span>,
            <LongTextCell key="actor" className="min-w-[140px]">
              {notification.actor ?? "System"}
            </LongTextCell>,
            <DateTimeCell key="createdAt" value={notification.createdAt} />,
            <LongTextCell key="message" className="w-full min-w-0">
              {notification.message ?? "No message body."}
            </LongTextCell>,
          ],
        }))}
        emptyMessage="No notifications were found for this user."
        searchPlaceholder="Search title, type, actor, or message"
        filterOptions={[
          { value: "READ", label: "Read" },
          { value: "UNREAD", label: "Unread" },
        ]}
        minWidthClass="min-w-[1320px]"
        columnClassNames={[
          "min-w-[220px]",
          "min-w-[120px]",
          "min-w-[100px]",
          "min-w-[160px]",
          "min-w-[210px]",
          "min-w-[420px]",
        ]}
        cellClassNames={[
          "min-w-[220px]",
          "min-w-[120px]",
          "min-w-[100px]",
          "min-w-[160px]",
          "min-w-[210px]",
          "min-w-[420px]",
        ]}
      />
    );
  }

  return (
    <DataTableSection
      userId={userId}
      activeTab={activeTab}
      searchParams={searchParams}
      sectionKey="audit"
      title="Audit & Moderation Timeline"
      columns={["Source", "Category", "Action", "Actor", "Created", "Reason / Note"]}
      rows={data.auditTimeline.map((entry) => ({
        key: `${entry.source}-${entry.id}`,
        searchableText: [
          entry.source,
          entry.category,
          entry.action,
          entry.actor ?? "",
          entry.reason ?? "",
          entry.note ?? "",
        ].join(" "),
        filterValue: entry.source,
        cells: [
          <span key="source" className={badgeClass("outline")}>
            {prettyText(entry.source)}
          </span>,
          <span key="category" className={badgeClass("outline")}>
            {prettyText(entry.category)}
          </span>,
          <span key="action" className="font-semibold text-[#2F1D3B]">
            {entry.action}
          </span>,
          <LongTextCell key="actor" className="min-w-[140px]">
            {entry.actor ?? "System"}
          </LongTextCell>,
          <DateTimeCell key="createdAt" value={entry.createdAt} />,
          <LongTextCell key="reason" className="w-full min-w-0">
            {entry.reason ?? entry.note ?? "No note recorded."}
          </LongTextCell>,
        ],
      }))}
      emptyMessage="No audit or moderation events were found for this user."
      searchPlaceholder="Search action, category, actor, or notes"
      filterOptions={[
        { value: "audit", label: "Audit" },
        { value: "moderation", label: "Moderation" },
      ]}
      minWidthClass="min-w-[1400px]"
      columnClassNames={[
        "min-w-[110px]",
        "min-w-[130px]",
        "min-w-[340px]",
        "min-w-[140px]",
        "min-w-[210px]",
        "min-w-[470px]",
      ]}
      cellClassNames={[
        "min-w-[110px]",
        "min-w-[130px]",
        "min-w-[340px]",
        "min-w-[140px]",
        "min-w-[210px]",
        "min-w-[470px]",
      ]}
    />
  );
}
