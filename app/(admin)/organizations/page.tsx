import { adminOrganizationAction, adminOrganizationMemberAction } from "@/app/actions/admin-platform";
import { getAdminOrganizationsPageData } from "@/lib/services/admin.server";
import Link from "next/link";

function prettyText(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null) {
  if (!value) return "Not verified";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function OrganizationsPage() {
  const data = await getAdminOrganizationsPageData();

  return (
    <div className="space-y-6">
      <section className="legal-panel px-6 py-7 md:px-8">
        <p className="legal-kicker">Organizations</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#102033]">
          Organization ownership, visibility, and member governance.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          This surface manages organization records that are already represented in the schema. Archive workflows and
          invitation queues still need dedicated models, so the portal focuses on ownership, visibility, membership
          state, and contribution footprint.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Organizations", value: data.summary.totalOrganizations },
          { label: "Public", value: data.summary.publicOrganizations },
          { label: "Private / Invite Only", value: data.summary.privateOrganizations },
          { label: "Without Owner", value: data.summary.ownerlessOrganizations },
        ].map((item) => (
          <div key={item.label} className="legal-panel p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#102033]">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="legal-panel p-5 md:p-6">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Create Organization</h2>
        <form action={adminOrganizationAction} className="mt-5 grid gap-4 xl:grid-cols-3">
          <input type="hidden" name="intent" value="create_org" />
          <input name="name" placeholder="Organization name" className="legal-field" required />
          <input name="slug" placeholder="organization-slug" className="legal-field" />
          <input name="ownerId" placeholder="Owner user ID" className="legal-field" />
          <select name="type" className="legal-field">
            <option value="LAW_FIRM">Law firm</option>
            <option value="BAR_ASSOCIATION">Bar association</option>
            <option value="LAW_SCHOOL">Law school</option>
            <option value="GOVERNMENT">Government</option>
            <option value="NGO">NGO</option>
            <option value="COMMUNITY">Community</option>
            <option value="OTHER">Other</option>
          </select>
          <select name="visibility" className="legal-field">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="INVITE_ONLY">Invite only</option>
          </select>
          <input name="reason" placeholder="Reason for creation" className="legal-field" required />
          <textarea name="description" placeholder="Description" className="legal-field min-h-[110px] xl:col-span-3" />
          <button type="submit" className="legal-button-primary xl:col-span-3 xl:w-fit">
            Create Organization
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {data.rows.map((row) => (
          <article key={row.id} className="legal-panel p-5 md:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F4EFF8] px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                    {prettyText(row.type)}
                  </span>
                  <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                    {prettyText(row.visibility)}
                  </span>
                  <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                    {row.memberCount} members
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#102033]">{row.name}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{row.description ?? "No description stored."}</p>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Owner</p>
                    <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{row.ownerName ?? "No owner assigned"}</p>
                  </div>
                  <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Verified</p>
                    <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{formatDate(row.verifiedAt)}</p>
                  </div>
                  <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Discussions</p>
                    <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{row.discussionCount}</p>
                  </div>
                  <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Cases</p>
                    <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{row.caseCount}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  <form action={adminOrganizationAction} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <input type="hidden" name="organizationId" value={row.id} />
                    <input type="hidden" name="intent" value="update_visibility" />
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[#2F1D3B]">Update Visibility</p>
                      <select name="visibility" defaultValue={row.visibility} className="legal-field">
                        <option value="PUBLIC">Public</option>
                        <option value="PRIVATE">Private</option>
                        <option value="INVITE_ONLY">Invite only</option>
                      </select>
                      <input name="reason" placeholder="Reason for visibility change" className="legal-field" required />
                      <button type="submit" className="legal-button-primary w-full text-sm">
                        Save Visibility
                      </button>
                    </div>
                  </form>

                  <form action={adminOrganizationAction} className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <input type="hidden" name="organizationId" value={row.id} />
                    <input type="hidden" name="intent" value="change_owner" />
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[#2F1D3B]">Change Owner</p>
                      <input name="ownerId" placeholder="New owner user ID" className="legal-field" required />
                      <input name="reason" placeholder="Reason for ownership change" className="legal-field" required />
                      <button type="submit" className="legal-button-primary w-full text-sm">
                        Save Owner
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="xl:w-[360px]">
                <div className="rounded-[22px] border border-[#4C2F5E]/10 bg-white p-4">
                  <p className="text-sm font-semibold text-[#2F1D3B]">Recent Members</p>
                  <div className="mt-4 space-y-4">
                    {row.recentMembers.length ? (
                      row.recentMembers.map((member) => (
                        <div key={member.id} className="rounded-[18px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                          <Link href={`/user/${member.userId}?tab=organizations`} className="text-sm font-semibold text-[#2F1D3B] hover:text-[#4C2F5E]">
                            {member.displayName}
                          </Link>
                          <p className="mt-1 text-xs text-slate-500">
                            {prettyText(member.role)} / {prettyText(member.status)}
                          </p>
                          <form action={adminOrganizationMemberAction} className="mt-3 space-y-2">
                            <input type="hidden" name="memberId" value={member.id} />
                            <select name="status" defaultValue={member.status} className="legal-field">
                              <option value="ACTIVE">Active</option>
                              <option value="INVITED">Invited</option>
                              <option value="SUSPENDED">Suspended</option>
                              <option value="LEFT">Left</option>
                            </select>
                            <input name="reason" placeholder="Reason for member status change" className="legal-field" required />
                            <button type="submit" className="legal-button-secondary w-full text-sm">
                              Update Member
                            </button>
                          </form>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No recent members for this organization.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
