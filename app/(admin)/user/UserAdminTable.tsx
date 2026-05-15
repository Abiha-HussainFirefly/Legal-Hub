"use client";

import { adminBulkNotificationAction, adminBulkUserAction } from "@/app/actions/admin-users";
import AdminPagination from "@/app/components/admin/AdminPagination";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

interface AdminUserRow {
  id: string;
  displayName: string;
  username: string | null;
  email: string | null;
  roles: string[];
  status: string;
  verificationStatus: string | null;
  isLawyer: boolean;
  organizationCount: number;
  activeMfaCount: number;
  regionName: string | null;
  lastLoginLabel: string;
  createdAtLabel: string;
}

interface UserAdminTableProps {
  rows: AdminUserRow[];
  pagination: {
    total: number;
    totalPages: number;
    start: number;
    end: number;
  };
  currentPage: number;
  pageLinks: Array<{ pageNumber: number; href: string }>;
  previousHref: string;
  nextHref: string;
  isFirstPage: boolean;
  isLastPage: boolean;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-[#E8F4EF] text-[#1B7A5A]";
    case "SUSPENDED":
      return "bg-[#F6EBD6] text-[#8B642A]";
    case "DISABLED":
    case "DELETED":
      return "bg-[#FCE8E6] text-[#A33A31]";
    default:
      return "bg-[#EEF2F7] text-[#36506E]";
  }
}

function verificationBadgeClass(status: string | null) {
  switch (status) {
    case "VERIFIED":
      return "bg-[#E8F4EF] text-[#1B7A5A]";
    case "PENDING":
    case "UNDER_REVIEW":
      return "bg-[#F6EBD6] text-[#8B642A]";
    case "REJECTED":
    case "EXPIRED":
      return "bg-[#FCE8E6] text-[#A33A31]";
    default:
      return "bg-[#EEF2F7] text-[#36506E]";
  }
}

function prettyText(value: string | null) {
  if (!value) return "Not submitted";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getUserRecordLabel(user: AdminUserRow) {
  return user.email ?? (user.username ? `@${user.username}` : user.displayName);
}

export default function UserAdminTable({
  rows,
  pagination,
  currentPage,
  pageLinks,
  previousHref,
  nextHref,
  isFirstPage,
  isLastPage,
}: UserAdminTableProps) {
  const router = useRouter();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("suspend");
  const [bulkReason, setBulkReason] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationReason, setNotificationReason] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [isPending, setIsPending] = useState(false);

  const selectedCount = selectedUserIds.length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const notificationMode = bulkAction === "assign_notification";
  const disableSubmit = selectedCount === 0 || isPending;

  const selectedSet = useMemo(() => new Set(selectedUserIds), [selectedUserIds]);

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  function toggleSelectAll() {
    setSelectedUserIds((current) => (current.length === rows.length ? [] : rows.map((row) => row.id)));
  }

  function buildFormData() {
    const formData = new FormData();
    for (const userId of selectedUserIds) {
      formData.append("selectedUserIds", userId);
    }
    return formData;
  }

  function resetActionFields() {
    setBulkReason("");
    setNotificationTitle("");
    setNotificationMessage("");
    setNotificationReason("");
  }

  async function handleBulkSubmit() {
    setFeedback(null);
    setIsPending(true);

    try {
      if (notificationMode) {
        const formData = buildFormData();
        formData.set("title", notificationTitle);
        formData.set("message", notificationMessage);
        formData.set("reason", notificationReason);
        await adminBulkNotificationAction(formData);
        setFeedback({ type: "success", message: `System notification sent to ${selectedCount} selected users.` });
      } else {
        const formData = buildFormData();
        formData.set("intent", bulkAction);
        formData.set("reason", bulkReason);
        await adminBulkUserAction(formData);
        setFeedback({ type: "success", message: `Bulk action applied to ${selectedCount} selected users.` });
      }

      setSelectedUserIds([]);
      resetActionFields();
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Bulk action failed",
      });
    } finally {
      setIsPending(false);
    }
  }

  function handleExport() {
    if (!selectedUserIds.length) {
      setFeedback({ type: "error", message: "Select at least one user before exporting." });
      return;
    }

    const query = new URLSearchParams({ ids: selectedUserIds.join(",") }).toString();
    window.location.href = `/api/admin/users/export?${query}`;
  }

  return (
    <div className="space-y-6">
      <section className="legal-panel p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_auto]">
          <select
            value={bulkAction}
            onChange={(event) => {
              setBulkAction(event.target.value);
              setFeedback(null);
            }}
            className="legal-field"
          >
            <option value="suspend">Suspend selected</option>
            <option value="disable">Disable selected</option>
            <option value="restore">Restore selected</option>
            <option value="revoke_sessions">Revoke active sessions</option>
            <option value="soft_delete">Soft delete selected</option>
            <option value="assign_notification">Assign system notification</option>
          </select>

          {notificationMode ? (
            <div className="grid gap-3 xl:grid-cols-3">
              <input
                value={notificationTitle}
                onChange={(event) => setNotificationTitle(event.target.value)}
                className="legal-field"
                placeholder="Notification title"
              />
              <input
                value={notificationMessage}
                onChange={(event) => setNotificationMessage(event.target.value)}
                className="legal-field"
                placeholder="Notification message"
              />
              <input
                value={notificationReason}
                onChange={(event) => setNotificationReason(event.target.value)}
                className="legal-field"
                placeholder="Reason for audit trail"
              />
            </div>
          ) : (
            <input
              value={bulkReason}
              onChange={(event) => setBulkReason(event.target.value)}
              className="legal-field"
              placeholder={bulkAction === "revoke_sessions" ? "Optional reason" : "Reason is required"}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={disableSubmit}
              className="legal-button-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Processing..." : notificationMode ? "Send Notification" : "Apply Bulk Action"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={disableSubmit}
              className="legal-button-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Export Selected
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>{selectedCount} selected on this page.</p>
          <p>Bulk delete is intentionally unavailable for production user records.</p>
        </div>

        {feedback ? (
          <div
            className={`mt-4 rounded-[18px] border px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "border-[#E9B8B3] bg-[#FDF1EF] text-[#A33A31]"
                : "border-[#BEE0D0] bg-[#EEF8F3] text-[#1B7A5A]"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </section>

      <section className="legal-table-wrap overflow-x-auto">
        <table className="legal-table w-full min-w-[1040px]">
          <thead>
            <tr>
              <th className="px-4 py-4 text-left text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                  className="h-4 w-4 rounded border-[#4C2F5E]/20"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Identity</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Roles</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Trust & MFA</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Region / Orgs</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Last Login</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rows.length ? (
              rows.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4 align-top">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      aria-label={`Select user record ${user.id.slice(0, 8).toUpperCase()}`}
                      className="mt-1 h-4 w-4 rounded border-[#4C2F5E]/20"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <p className="break-all text-sm font-semibold text-[#2F1D3B]">{getUserRecordLabel(user)}</p>
                      <p className="text-xs text-slate-500">
                        {user.username ? `@${user.username}` : "No username"} / {user.isLawyer ? "Lawyer profile" : "Standard profile"}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length ? (
                        user.roles.map((role) => (
                          <span key={role} className="workspace-pill">
                            {prettyText(role)}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No roles assigned</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(user.status)}`}>
                      {prettyText(user.status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <div className="space-y-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${verificationBadgeClass(
                          user.verificationStatus,
                        )}`}
                      >
                        {prettyText(user.verificationStatus)}
                      </span>
                      <p className="text-xs text-slate-500">
                        {user.activeMfaCount > 0 ? `${user.activeMfaCount} active MFA factors` : "No active MFA factors"}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <p className="text-sm text-[#2F1D3B]">{user.regionName ?? "No region set"}</p>
                    <p className="text-xs text-slate-500">{user.organizationCount} active organization memberships</p>
                  </td>

                  <td className="px-6 py-4 align-top text-sm text-slate-600">{user.lastLoginLabel}</td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">{user.createdAtLabel}</td>
                  <td className="px-6 py-4 align-top">
                    <Link
                      href={`/user/${user.id}`}
                      className="legal-button-secondary inline-flex w-full min-w-[156px] justify-center px-4 py-2 text-center text-sm"
                    >
                      Open admin record
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500">
                  No users matched the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <AdminPagination
        start={pagination.start}
        end={pagination.end}
        total={pagination.total}
        currentPage={currentPage}
        pageLinks={pageLinks}
        previousHref={previousHref}
        nextHref={nextHref}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
      />
    </div>
  );
}
