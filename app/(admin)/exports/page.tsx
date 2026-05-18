import AdminSearchField from "@/app/components/admin/AdminSearchField";
import { getAdminUserSearchSuggestions } from "@/lib/services/admin.server";

function ExportCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-panel p-5 md:p-6">
      <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ExportForm({
  dataset,
  children,
}: {
  dataset: string;
  children: React.ReactNode;
}) {
  return (
    <form action="/api/admin/exports" method="get" className="space-y-3">
      <input type="hidden" name="dataset" value={dataset} />
      {children}
      <button type="submit" className="legal-button-primary w-full text-sm">
        Download CSV
      </button>
    </form>
  );
}

export default async function AdminExportsPage() {
  const userSuggestions = await getAdminUserSearchSuggestions();

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">Exports & Reports</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
          Audited CSV exports for admin queues and compliance review.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Every download from this surface writes an audit event. Use the same filter model as the live admin pages to
          export users, verification work, moderation activity, case review backlogs, files, notifications, RBAC
          catalogs, and audit history.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ExportCard
          title="Users"
          description="Export filtered user identity, role, status, verification, MFA, and last-login data."
        >
          <ExportForm dataset="users">
            <div className="grid gap-3 md:grid-cols-2">
              <AdminSearchField
                placeholder="Name, email, username, organization"
                wrapperClassName="md:col-span-2"
                listId="admin-export-user-suggestions"
                suggestions={userSuggestions}
              />
              <select name="status" className="legal-field">
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="DISABLED">Disabled</option>
                <option value="DELETED">Deleted</option>
              </select>
              <select name="role" className="legal-field">
                <option value="">All roles</option>
                <option value="super_admin">Super admin</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="lawyer">Lawyer</option>
                <option value="member">Member</option>
              </select>
              <select name="mfa" className="legal-field">
                <option value="">All MFA states</option>
                <option value="enabled">MFA enabled</option>
                <option value="disabled">MFA missing</option>
              </select>
            </div>
          </ExportForm>
        </ExportCard>

        <ExportCard
          title="Lawyer Verification"
          description="Export verification queue state, document gaps, scan flags, and review traceability."
        >
          <ExportForm dataset="verification">
            <div className="grid gap-3 md:grid-cols-2">
              <AdminSearchField placeholder="Applicant, bar council, license number" wrapperClassName="md:col-span-2" />
              <select name="status" className="legal-field">
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <input name="region" placeholder="Region filter" className="legal-field" />
              <select name="missingDocs" className="legal-field">
                <option value="">All document states</option>
                <option value="yes">Missing required documents</option>
              </select>
            </div>
          </ExportForm>
        </ExportCard>

        <ExportCard
          title="Moderation"
          description="Export reports, AI alerts, or moderation actions using the same filters as the moderation center."
        >
          <ExportForm dataset="moderation">
            <div className="grid gap-3 md:grid-cols-2">
              <select name="tab" className="legal-field">
                <option value="reports">Reports</option>
                <option value="alerts">AI alerts</option>
                <option value="actions">Action log</option>
              </select>
              <AdminSearchField placeholder="Target, reason, reviewer, source" wrapperClassName="md:col-span-2" />
              <select name="targetType" className="legal-field">
                <option value="">All target types</option>
                <option value="DISCUSSION">Discussion</option>
                <option value="ANSWER">Answer</option>
                <option value="COMMENT">Comment</option>
                <option value="CASE">Case</option>
              </select>
              <input name="status" placeholder="Status filter" className="legal-field" />
              <input name="severity" placeholder="Severity for alerts" className="legal-field md:col-span-2" />
            </div>
          </ExportForm>
        </ExportCard>

        <ExportCard
          title="Case Review"
          description="Export repository review backlogs with source health, moderation signals, and publication workflow state."
        >
          <ExportForm dataset="cases">
            <div className="grid gap-3 md:grid-cols-2">
              <AdminSearchField placeholder="Title, citation, author, category" wrapperClassName="md:col-span-2" />
              <select name="status" className="legal-field">
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="REJECTED">Rejected</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
                <option value="REMOVED">Removed</option>
              </select>
              <input name="sourceType" placeholder="Source type" className="legal-field" />
              <input name="region" placeholder="Region" className="legal-field" />
              <input name="court" placeholder="Court" className="legal-field" />
              <input name="organization" placeholder="Organization" className="legal-field" />
              <input name="reviewedBy" placeholder="Reviewer" className="legal-field md:col-span-2" />
            </div>
          </ExportForm>
        </ExportCard>

        <ExportCard
          title="Files"
          description="Export file inventory and scan posture to investigate exposure, quarantine state, and parent linkage."
        >
          <ExportForm dataset="files">
            <div className="grid gap-3 md:grid-cols-2">
              <AdminSearchField placeholder="Filename, checksum, MIME, uploader" wrapperClassName="md:col-span-2" />
              <select name="scanStatus" className="legal-field">
                <option value="">All scan states</option>
                <option value="PENDING">Pending</option>
                <option value="CLEAN">Clean</option>
                <option value="INFECTED">Infected</option>
                <option value="FAILED">Failed</option>
              </select>
              <select name="parentType" className="legal-field md:col-span-2">
                <option value="">All parent types</option>
                <option value="discussion">Discussion attachment</option>
                <option value="answer">Answer attachment</option>
                <option value="comment">Comment attachment</option>
                <option value="case">Case-linked file</option>
                <option value="verification">Verification document</option>
                <option value="orphaned">Orphaned asset</option>
              </select>
            </div>
          </ExportForm>
        </ExportCard>

        <ExportCard
          title="Notifications"
          description="Export in-app notification history by type, actor, recipient, and read state."
        >
          <ExportForm dataset="notifications">
            <div className="grid gap-3 md:grid-cols-2">
              <AdminSearchField placeholder="Title, message, actor, recipient" wrapperClassName="md:col-span-2" />
              <input name="type" placeholder="Notification type" className="legal-field" />
              <select name="read" className="legal-field">
                <option value="">All read states</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
              <input name="recipient" placeholder="Recipient name" className="legal-field" />
              <input name="actor" placeholder="Actor name" className="legal-field md:col-span-2" />
            </div>
          </ExportForm>
        </ExportCard>

        <ExportCard
          title="RBAC Catalog"
          description="Export role and permission matrices for security review and access governance."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ExportForm dataset="roles">
              <AdminSearchField placeholder="Role name or description" />
              <select name="system" className="legal-field">
                <option value="">All roles</option>
                <option value="system">System roles</option>
                <option value="custom">Custom roles</option>
              </select>
            </ExportForm>

            <ExportForm dataset="permissions">
              <AdminSearchField placeholder="Permission key or description" />
              <input name="module" placeholder="Module name" className="legal-field" />
            </ExportForm>
          </div>
        </ExportCard>

        <ExportCard
          title="Audit & Security"
          description="Export audit history filtered by category and security review focus for investigations."
        >
          <ExportForm dataset="audit">
            <div className="grid gap-3 md:grid-cols-2">
              <AdminSearchField placeholder="Actor, target, action, IP, device" wrapperClassName="md:col-span-2" />
              <input name="category" placeholder="Audit category" className="legal-field" />
              <label className="flex items-center gap-2 rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-3 text-sm text-[#2F1D3B]">
                <input type="checkbox" name="failedOnly" value="1" />
                Failed attempts only
              </label>
              <label className="flex items-center gap-2 rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-3 text-sm text-[#2F1D3B]">
                <input type="checkbox" name="privilegedOnly" value="1" />
                Privileged sessions focus
              </label>
            </div>
          </ExportForm>
        </ExportCard>
      </div>
    </div>
  );
}
