import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── 96 Permissions ───────────────────────────────────────────────────────────
const PERMISSIONS = [
  // Admin Dashboard
  { key: "admin.dashboard.view",           description: "Access the SuperAdmin dashboard homepage and overview cards." },
  { key: "admin.dashboard.analytics.view", description: "View dashboard analytics, counters, and summary widgets." },
  { key: "admin.profile.view.self",        description: "View own SuperAdmin profile." },
  { key: "admin.profile.edit.self",        description: "Edit own SuperAdmin profile." },

  // User Management
  { key: "users.view",                     description: "View user listing in admin portal." },
  { key: "users.view.detail",              description: "View full user details, profile, and account metadata." },
  { key: "users.search",                   description: "Search and filter users." },
  { key: "users.status.manage",            description: "Suspend, activate, or otherwise change user account status." },
  { key: "users.role.assign",              description: "Assign roles to users." },
  { key: "users.role.remove",              description: "Remove roles from users." },
  { key: "users.access.audit",             description: "Review user activity and account access state." },

  // Lawyer Verification
  { key: "verification.queue.view",        description: "View lawyer verification queue." },
  { key: "verification.request.view",      description: "Open a single lawyer verification request." },
  { key: "verification.approve",           description: "Approve a lawyer verification request." },
  { key: "verification.reject",            description: "Reject a lawyer verification request." },
  { key: "verification.note.manage",       description: "Add or update admin verification notes." },

  // Moderation
  { key: "moderation.queue.view",          description: "View moderation queues, flagged content, and user reports." },
  { key: "moderation.report.view",         description: "View a specific moderation report or flagged item." },
  { key: "moderation.resolve",             description: "Mark reports or moderation cases as resolved." },
  { key: "moderation.remove_content",      description: "Remove discussion, answer, comment, or case content through moderation action." },
  { key: "moderation.warn_user",           description: "Issue warning or moderation action against user." },
  { key: "moderation.archive_content",     description: "Archive or hide content from public view." },

  // Reports & Exports
  { key: "reports.view",                   description: "Access reports and insights screens." },
  { key: "reports.analytics.view",         description: "View reporting charts, trend summaries, and metrics." },
  { key: "reports.export",                 description: "Export reports to PDF or downloadable format." },

  // Admin Settings
  { key: "settings.view",                  description: "Access admin settings area." },
  { key: "settings.edit",                  description: "Modify admin settings and configuration values." },

  // Role & Permission Administration
  { key: "roles.view",                     description: "View all roles in the system." },
  { key: "roles.create",                   description: "Create new roles." },
  { key: "roles.edit",                     description: "Edit role names and descriptions." },
  { key: "roles.delete",                   description: "Delete non-system roles." },
  { key: "permissions.view",               description: "View all permissions in the system." },
  { key: "permissions.create",             description: "Create new permissions." },
  { key: "permissions.edit",              description: "Edit permission definitions." },
  { key: "permissions.delete",             description: "Delete unused permissions." },
  { key: "role_permissions.view",          description: "View permission assignments for roles." },
  { key: "role_permissions.manage",        description: "Assign or remove permissions for roles." },
  { key: "user_roles.view",               description: "View role assignments for users." },
  { key: "user_roles.manage",             description: "Assign or remove roles from users." },

  // Case Review Console
  { key: "cases.review.queue.view",        description: "View case review queue in admin portal." },
  { key: "cases.review.detail.view",       description: "Open detailed review page for a case." },
  { key: "cases.review.publish",           description: "Publish a reviewed case record." },
  { key: "cases.review.reject",            description: "Reject a case and send it back for changes." },
  { key: "cases.review.archive",           description: "Archive or remove a case from active repository." },
  { key: "cases.review.note.manage",       description: "Add or update reviewer notes on a case." },
  { key: "cases.review.status.manage",     description: "Change case workflow status during admin review." },

  // Global Repository / Content Oversight
  { key: "discussions.admin.view_all",     description: "View all discussions including moderated or restricted content." },
  { key: "cases.admin.view_all",           description: "View all cases including non-public workflow states." },
  { key: "profiles.admin.view_all",        description: "View all user profiles with admin oversight access." },
  { key: "notifications.admin.audit",      description: "Audit notification-related system behavior if needed." },

  // ── LawyerUser Permissions ──────────────────────────────────────────────────

  // Authentication & Self Account
  { key: "auth.login",                     description: "Sign in to LawyerUser portal." },
  { key: "auth.logout",                    description: "Sign out from LawyerUser portal." },
  { key: "auth.register",                  description: "Register a LawyerUser account." },
  { key: "auth.password.reset",            description: "Request password reset and set new password." },
  { key: "auth.email.verify",              description: "Verify account email." },
  { key: "account.view.self",              description: "View own account/session details." },
  { key: "account.edit.self",              description: "Update own basic account details." },
  { key: "account.password.change.self",   description: "Change own password." },

  // Lawyer Profile
  { key: "profile.view.self",              description: "View own lawyer profile." },
  { key: "profile.setup.self",             description: "Access profile setup flow." },
  { key: "profile.edit.self",              description: "Edit own professional profile." },
  { key: "profile.stats.view.self",        description: "View own profile statistics and analytics." },
  { key: "profile.visibility.manage.self", description: "Manage visibility settings for own profile sections." },
  { key: "profile.public.view",            description: "View public lawyer/member profiles." },
  { key: "profile.view.track",             description: "Record and track profile views." },

  // Discussions
  { key: "discussions.view",               description: "View discussions listing and detail pages." },
  { key: "discussions.create",             description: "Create a new discussion." },
  { key: "discussions.edit.own",           description: "Edit own discussion." },
  { key: "discussions.delete.own",         description: "Soft delete own discussion." },
  { key: "discussions.view.own",           description: "View own created discussions in My Discussions / Topics area." },
  { key: "discussions.view.saved_own",     description: "View own saved discussions." },
  { key: "discussions.bookmark",           description: "Save or unsave a discussion." },
  { key: "discussions.follow",             description: "Follow or unfollow a discussion." },
  { key: "discussions.react",              description: "React to a discussion with vote or emoji." },
  { key: "discussions.ai_summary.view",    description: "View AI summary for a discussion when available." },

  // Answers
  { key: "answers.view",                   description: "View answers under a discussion." },
  { key: "answers.create",                 description: "Post an answer to a discussion." },
  { key: "answers.react",                  description: "React to an answer." },
  { key: "answers.accept.on_own_discussion", description: "Accept an answer on a discussion owned by the current LawyerUser." },

  // Comments
  { key: "comments.view",                  description: "View discussion and answer comments." },
  { key: "comments.create",                description: "Post comment or reply on discussion/answer threads." },
  { key: "comments.react",                 description: "React to comments." },

  // Notifications
  { key: "notifications.view.self",        description: "View own notifications." },
  { key: "notifications.mark_read.self",   description: "Mark own notifications as read." },

  // Case Repository
  { key: "cases.view",                     description: "View case repository listing and public case details." },
  { key: "cases.meta.view",               description: "View case repository filter metadata such as categories, tags, courts, and regions." },
  { key: "cases.create.draft",             description: "Create a new case draft." },
  { key: "cases.view.own_dashboard",       description: "View own case board / My Cases screen." },
  { key: "cases.view.own_unpublished",     description: "View own draft, rejected, and pending-review case records." },
  { key: "cases.edit.own",                 description: "Edit own case draft or own editable case record." },
  { key: "cases.submit.own_for_review",    description: "Submit own draft or rejected case for admin review." },
  { key: "cases.bookmark",                 description: "Save or unsave case records." },
  { key: "cases.view.saved_own",           description: "View own saved case collection." },
  { key: "cases.share",                    description: "Share case record links." },

  // Personal Workspace
  { key: "saved.view.self",                description: "Access personal saved workspace modules." },
  { key: "topics.view.self",               description: "Access own discussion topics / My Discussions module." },
];

// Keys assigned to LawyerUser (permissions 51–96 in the catalog)
const LAWYER_PERMISSION_KEYS = new Set([
  "auth.login", "auth.logout", "auth.register", "auth.password.reset", "auth.email.verify",
  "account.view.self", "account.edit.self", "account.password.change.self",
  "profile.view.self", "profile.setup.self", "profile.edit.self", "profile.stats.view.self",
  "profile.visibility.manage.self", "profile.public.view", "profile.view.track",
  "discussions.view", "discussions.create", "discussions.edit.own", "discussions.delete.own",
  "discussions.view.own", "discussions.view.saved_own", "discussions.bookmark",
  "discussions.follow", "discussions.react", "discussions.ai_summary.view",
  "answers.view", "answers.create", "answers.react", "answers.accept.on_own_discussion",
  "comments.view", "comments.create", "comments.react",
  "notifications.view.self", "notifications.mark_read.self",
  "cases.view", "cases.meta.view", "cases.create.draft", "cases.view.own_dashboard",
  "cases.view.own_unpublished", "cases.edit.own", "cases.submit.own_for_review",
  "cases.bookmark", "cases.view.saved_own", "cases.share",
  "saved.view.self", "topics.view.self",
]);

async function main() {
  console.log("🌱 Seeding roles, permissions, and assignments...\n");

  // ── 1. Upsert Roles ──────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: { isActive: true },
    create: { name: "admin", description: "SuperAdmin — full system access", isActive: true, isSystem: true },
  });

  const lawyerRole = await prisma.role.upsert({
    where: { name: "lawyer" },
    update: { isActive: true },
    create: { name: "lawyer", description: "LawyerUser — lawyer portal access", isActive: true, isSystem: true },
  });

  console.log(`✅ Roles ready: admin (${adminRole.id}), lawyer (${lawyerRole.id})`);

  // ── 2. Upsert all 96 Permissions ─────────────────────────────────────────────
  const permissionIds: Record<string, string> = {};

  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description, isActive: true },
      create: { key: perm.key, description: perm.description, isActive: true },
    });
    permissionIds[perm.key] = record.id;
  }

  console.log(`✅ ${PERMISSIONS.length} permissions upserted`);

  // ── 3. Assign ALL permissions to admin ───────────────────────────────────────
  let adminCount = 0;
  for (const perm of PERMISSIONS) {
    const permId = permissionIds[perm.key];
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permId } },
      update: { isActive: true },
      create: { roleId: adminRole.id, permissionId: permId, isActive: true },
    });
    adminCount++;
  }
  console.log(`✅ Admin role: ${adminCount} permissions assigned`);

  // ── 4. Assign lawyer-only permissions to lawyer ───────────────────────────────
  let lawyerCount = 0;
  for (const key of LAWYER_PERMISSION_KEYS) {
    const permId = permissionIds[key];
    if (!permId) { console.warn(`  ⚠️  Missing permission key: ${key}`); continue; }
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: lawyerRole.id, permissionId: permId } },
      update: { isActive: true },
      create: { roleId: lawyerRole.id, permissionId: permId, isActive: true },
    });
    lawyerCount++;
  }
  console.log(`✅ Lawyer role: ${lawyerCount} permissions assigned`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());