import { adminSystemNotificationAction } from "@/app/actions/admin-notifications";
import AdminPagination from "@/app/components/admin/AdminPagination";
import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminNotificationsPageData } from "@/lib/services/admin.server";
import { BellRing, MessageSquareText, ShieldAlert } from "lucide-react";
import Link from "next/link";

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

function prettyText(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildQueryString(
  filters: {
    q: string;
    type: string;
    read: string;
    recipient: string;
    actor: string;
    page: number;
  },
  overrides: Partial<{
    q: string;
    type: string;
    read: string;
    recipient: string;
    actor: string;
    page: number;
  }> = {},
) {
  const params = new URLSearchParams();
  const next = { ...filters, ...overrides };

  if (next.q) params.set("q", next.q);
  if (next.type) params.set("type", next.type);
  if (next.read) params.set("read", next.read);
  if (next.recipient) params.set("recipient", next.recipient);
  if (next.actor) params.set("actor", next.actor);
  if (next.page > 1) params.set("page", `${next.page}`);

  const query = params.toString();
  return query ? `/notifications?${query}` : "/notifications";
}

function readStateClasses(isRead: boolean) {
  return isRead ? "bg-[#EEF2F7] text-[#36506E]" : "bg-[#F6EBD6] text-[#8B642A]";
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const data = await getAdminNotificationsPageData({
    q: getFirstParam(resolvedSearchParams.q),
    type: getFirstParam(resolvedSearchParams.type),
    read: getFirstParam(resolvedSearchParams.read),
    recipient: getFirstParam(resolvedSearchParams.recipient),
    actor: getFirstParam(resolvedSearchParams.actor),
    page: Number.parseInt(getFirstParam(resolvedSearchParams.page) ?? "1", 10),
  });

  const currentFilters = data.filters;
  const visiblePages = Array.from({ length: data.pagination.totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentFilters.page - 3),
    currentFilters.page + 2,
  );

  const summaryCards = [
    {
      title: "Generated Today",
      value: formatNumber(data.summary.generatedToday),
      detail: "In-app notifications created in the current day window",
      icon: BellRing,
    },
    {
      title: "Unread System Notices",
      value: formatNumber(data.summary.unreadSystemNotices),
      detail: "System-wide notices still unread by recipients",
      icon: ShieldAlert,
    },
    {
      title: "System Notifications",
      value: formatNumber(data.summary.systemNotifications),
      detail: "Messages created with the platform SYSTEM notification type",
      icon: MessageSquareText,
    },
    {
      title: "Unread Total",
      value: formatNumber(data.summary.unreadTotal),
      detail: "All unread notifications across notification types",
      icon: BellRing,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">Notifications & Communications</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
              Inspect in-app notices and their related content from one queue.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              This page reads the `Notification` ledger directly and lets admins filter by type, read state, actor,
              recipient, and related discussion or case context without editing delivery history.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-5 py-4 text-sm text-slate-600">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Current result window</p>
            <p className="mt-2 text-base font-semibold text-[#2F1D3B]">
              {data.pagination.start} to {data.pagination.end} of {formatNumber(data.pagination.total)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="legal-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{card.title}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{card.value}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{card.detail}</p>
                </div>
                <div className="rounded-[18px] bg-[#F4EFF8] p-3 text-[#4C2F5E]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="legal-panel p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">System Notice Composer</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Send an in-app `SYSTEM` notification to a filtered user segment. A reason is mandatory, the action is
              audited, and the current implementation caps one send at 1000 recipients to keep bulk fan-out controlled.
            </p>
          </div>
        </div>

        <form action={adminSystemNotificationAction} className="mt-5 grid gap-4 xl:grid-cols-2">
          <input name="title" placeholder="Notification title" className="legal-field" required />
          <input name="reason" placeholder="Operational reason for this send" className="legal-field" required />
          <textarea
            name="message"
            placeholder="Notification body"
            className="legal-field min-h-[120px] xl:col-span-2"
          />

          <input name="q" placeholder="Name, email, or username filter" className="legal-field" />

          <select name="role" className="legal-field">
            <option value="">All roles</option>
            <option value="super_admin">Super admin</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="lawyer">Lawyer</option>
            <option value="member">Member</option>
          </select>

          <select name="status" className="legal-field" defaultValue="ACTIVE">
            <option value="ACTIVE">Active users</option>
            <option value="">All statuses</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DISABLED">Disabled</option>
            <option value="DELETED">Deleted</option>
          </select>

          <select name="userType" className="legal-field">
            <option value="">All user types</option>
            <option value="EXTERNAL">External</option>
            <option value="SYSTEM">System</option>
          </select>

          <select name="verification" className="legal-field">
            <option value="">All verification states</option>
            <option value="VERIFIED">Verified lawyer</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
            <option value="NOT_SUBMITTED">Not submitted</option>
          </select>

          <label className="flex items-center gap-2 rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-3 text-sm text-[#2F1D3B]">
            <input type="checkbox" name="sendToAll" value="yes" />
            Send to all if no audience filters are set
          </label>

          <div className="xl:col-span-2">
            <button type="submit" className="legal-button-primary w-full xl:w-auto">
              Send System Notice
            </button>
          </div>
        </form>
      </section>

      <section className="legal-panel p-4 md:p-6">
        <form className="grid gap-4 xl:grid-cols-5">
          <AdminSearchField
            defaultValue={currentFilters.q}
            placeholder="Search title, message, actor, or recipient"
            wrapperClassName="xl:col-span-2"
          />

          <select name="type" defaultValue={currentFilters.type} className="legal-field">
            <option value="">All types</option>
            <option value="SYSTEM">System</option>
            <option value="CASE_PUBLISHED">Case published</option>
            <option value="CASE_UPDATED">Case updated</option>
            <option value="CASE_COMMENTED">Case commented</option>
            <option value="VERIFICATION_APPROVED">Verification approved</option>
            <option value="VERIFICATION_REJECTED">Verification rejected</option>
            <option value="REPORT_UPDATE">Report update</option>
          </select>

          <select name="read" defaultValue={currentFilters.read} className="legal-field">
            <option value="">All read states</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          <input type="text" name="recipient" defaultValue={currentFilters.recipient} placeholder="Recipient name" className="legal-field" />
          <input type="text" name="actor" defaultValue={currentFilters.actor} placeholder="Actor name" className="legal-field" />

          <div className="flex items-center gap-3 xl:col-span-5">
            <button type="submit" className="legal-button-primary w-full xl:w-auto">
              Apply Filters
            </button>
            <Link href="/notifications" className="legal-button-secondary w-full xl:w-auto">
              Reset
            </Link>
          </div>
        </form>
      </section>

      <section className="legal-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="legal-table w-full min-w-[1040px]">
            <thead>
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Notification</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Recipient</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Actor</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Read State</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Related Record</th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8C7A9B]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE7F2]">
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-semibold text-[#2F1D3B]">{row.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{prettyText(row.type)}</p>
                      {row.message ? <p className="mt-2 text-sm text-slate-600">{row.message}</p> : null}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{row.recipientName}</td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{row.actorName ?? "System"}</td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${readStateClasses(row.isRead)}`}>
                        {row.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      {row.relatedLabel ? (
                        row.relatedHref ? (
                          <Link href={row.relatedHref} className="font-medium text-[#4C2F5E] hover:text-[#2F1D3B]">
                            {row.relatedLabel}
                          </Link>
                        ) : (
                          row.relatedLabel
                        )
                      ) : (
                        "No related entity"
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">{formatDate(row.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No notifications match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          start={data.pagination.start}
          end={data.pagination.end}
          total={data.pagination.total}
          currentPage={currentFilters.page}
          pageLinks={visiblePages.map((pageNumber) => ({
            pageNumber,
            href: buildQueryString(currentFilters, { page: pageNumber }),
          }))}
          previousHref={buildQueryString(currentFilters, { page: Math.max(1, currentFilters.page - 1) })}
          nextHref={buildQueryString(currentFilters, { page: Math.min(data.pagination.totalPages, currentFilters.page + 1) })}
          isFirstPage={currentFilters.page === 1}
          isLastPage={currentFilters.page === data.pagination.totalPages}
        />
      </section>
    </div>
  );
}
