import { LAWYER_PERMISSION_KEYS as LAWYER_PERMISSION_KEY_LIST } from "@/lib/auth/permission-catalog";

export const ADMIN_PERMISSION_KEYS = {
  DASHBOARD_VIEW: "admin.dashboard.view",
  REPORTS_VIEW: "reports.view",
  EXPORTS_VIEW: "reports.export",
  USERS_MANAGE: "users.status.manage",
  ROLES_MANAGE: "user_roles.manage",
  PERMISSIONS_MANAGE: "role_permissions.manage",
  VERIFICATION_REVIEW: "verification.queue.view",
  SECURITY_MANAGE: "settings.edit",
  CASE_REVIEW: "cases.review.queue.view",
  DISCUSSIONS_MANAGE: "discussions.admin.view_all",
  MODERATION_MANAGE: "moderation.queue.view",
  FILES_MANAGE: "settings.edit",
  NOTIFICATIONS_MANAGE: "notifications.admin.audit",
  SYSTEM_JOBS_VIEW: "settings.view",
  TAXONOMY_MANAGE: "settings.edit",
  GAMIFICATION_MANAGE: "reports.analytics.view",
  ORGANIZATIONS_MANAGE: "settings.edit",
} as const;

export const LAWYER_PERMISSION_KEYS = {
  ACCOUNT_VIEW_SELF: "account.view.self",
  ACCOUNT_EDIT_SELF: "account.edit.self",
  ACCOUNT_PASSWORD_CHANGE_SELF: "account.password.change.self",
  PROFILE_VIEW_SELF: "profile.view.self",
  PROFILE_SETUP_SELF: "profile.setup.self",
  PROFILE_EDIT_SELF: "profile.edit.self",
  PROFILE_STATS_VIEW_SELF: "profile.stats.view.self",
  PROFILE_VISIBILITY_MANAGE_SELF: "profile.visibility.manage.self",
  PROFILE_PUBLIC_VIEW: "profile.public.view",
  PROFILE_VIEW_TRACK: "profile.view.track",
  DISCUSSIONS_VIEW: "discussions.view",
  DISCUSSIONS_CREATE: "discussions.create",
  DISCUSSIONS_EDIT_OWN: "discussions.edit.own",
  DISCUSSIONS_DELETE_OWN: "discussions.delete.own",
  DISCUSSIONS_VIEW_OWN: "discussions.view.own",
  DISCUSSIONS_VIEW_SAVED_OWN: "discussions.view.saved_own",
  DISCUSSIONS_BOOKMARK: "discussions.bookmark",
  DISCUSSIONS_FOLLOW: "discussions.follow",
  DISCUSSIONS_REACT: "discussions.react",
  DISCUSSIONS_AI_SUMMARY_VIEW: "discussions.ai_summary.view",
  ANSWERS_VIEW: "answers.view",
  ANSWERS_CREATE: "answers.create",
  ANSWERS_REACT: "answers.react",
  ANSWERS_ACCEPT_ON_OWN_DISCUSSION: "answers.accept.on_own_discussion",
  COMMENTS_VIEW: "comments.view",
  COMMENTS_CREATE: "comments.create",
  COMMENTS_REACT: "comments.react",
  NOTIFICATIONS_VIEW_SELF: "notifications.view.self",
  NOTIFICATIONS_MARK_READ_SELF: "notifications.mark_read.self",
  CASES_VIEW: "cases.view",
  CASES_META_VIEW: "cases.meta.view",
  CASES_CREATE_DRAFT: "cases.create.draft",
  CASES_VIEW_OWN_DASHBOARD: "cases.view.own_dashboard",
  CASES_VIEW_OWN_UNPUBLISHED: "cases.view.own_unpublished",
  CASES_EDIT_OWN: "cases.edit.own",
  CASES_SUBMIT_OWN_FOR_REVIEW: "cases.submit.own_for_review",
  CASES_BOOKMARK: "cases.bookmark",
  CASES_VIEW_SAVED_OWN: "cases.view.saved_own",
  CASES_SHARE: "cases.share",
  SAVED_VIEW_SELF: "saved.view.self",
  TOPICS_VIEW_SELF: "topics.view.self",
} as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[keyof typeof ADMIN_PERMISSION_KEYS];
export type LawyerPermissionKey = (typeof LAWYER_PERMISSION_KEYS)[keyof typeof LAWYER_PERMISSION_KEYS];
type PermissionRequirement = string | string[];

const ADMIN_PORTAL_ROLES = new Set(["admin", "super_admin", "superadmin"]);
const LAWYER_PORTAL_ROLES = new Set(["lawyer", "lawyer_user", "lawyeruser"]);
const DEFAULT_ADMIN_PERMISSIONS = new Set<string>(Object.values(ADMIN_PERMISSION_KEYS));
const DEFAULT_LAWYER_PERMISSIONS = new Set<string>(LAWYER_PERMISSION_KEY_LIST);

const DEFAULT_ROLE_PERMISSIONS: Record<string, Set<string>> = {
  admin: DEFAULT_ADMIN_PERMISSIONS,
  super_admin: DEFAULT_ADMIN_PERMISSIONS,
  superadmin: DEFAULT_ADMIN_PERMISSIONS,
  lawyer: DEFAULT_LAWYER_PERMISSIONS,
  lawyer_user: DEFAULT_LAWYER_PERMISSIONS,
  lawyeruser: DEFAULT_LAWYER_PERMISSIONS,
};

const ADMIN_ROUTE_PERMISSION_RULES: Array<{ prefix: string; permission: AdminPermissionKey }> = [
  { prefix: "/dashboard", permission: ADMIN_PERMISSION_KEYS.DASHBOARD_VIEW },
  { prefix: "/reports", permission: ADMIN_PERMISSION_KEYS.REPORTS_VIEW },
  { prefix: "/exports", permission: ADMIN_PERMISSION_KEYS.EXPORTS_VIEW },
  { prefix: "/user", permission: ADMIN_PERMISSION_KEYS.USERS_MANAGE },
  { prefix: "/roles", permission: ADMIN_PERMISSION_KEYS.ROLES_MANAGE },
  { prefix: "/permissions", permission: ADMIN_PERMISSION_KEYS.PERMISSIONS_MANAGE },
  { prefix: "/verification", permission: ADMIN_PERMISSION_KEYS.VERIFICATION_REVIEW },
  { prefix: "/settings", permission: ADMIN_PERMISSION_KEYS.SECURITY_MANAGE },
  { prefix: "/case-review", permission: ADMIN_PERMISSION_KEYS.CASE_REVIEW },
  { prefix: "/discussion-ops", permission: ADMIN_PERMISSION_KEYS.DISCUSSIONS_MANAGE },
  { prefix: "/moderation", permission: ADMIN_PERMISSION_KEYS.MODERATION_MANAGE },
  { prefix: "/files", permission: ADMIN_PERMISSION_KEYS.FILES_MANAGE },
  { prefix: "/notifications", permission: ADMIN_PERMISSION_KEYS.NOTIFICATIONS_MANAGE },
  { prefix: "/system-jobs", permission: ADMIN_PERMISSION_KEYS.SYSTEM_JOBS_VIEW },
  { prefix: "/taxonomy", permission: ADMIN_PERMISSION_KEYS.TAXONOMY_MANAGE },
  { prefix: "/gamification", permission: ADMIN_PERMISSION_KEYS.GAMIFICATION_MANAGE },
  { prefix: "/organizations", permission: ADMIN_PERMISSION_KEYS.ORGANIZATIONS_MANAGE },
];

const LAWYER_ROUTE_PERMISSION_RULES: Array<{ prefix: string; permission: PermissionRequirement }> = [
  { prefix: "/profile/setup", permission: LAWYER_PERMISSION_KEYS.PROFILE_SETUP_SELF },
  { prefix: "/profile/edit", permission: LAWYER_PERMISSION_KEYS.PROFILE_EDIT_SELF },
  { prefix: "/profile/stats", permission: LAWYER_PERMISSION_KEYS.PROFILE_STATS_VIEW_SELF },
  { prefix: "/profile", permission: LAWYER_PERMISSION_KEYS.PROFILE_VIEW_SELF },
  { prefix: "/topics", permission: LAWYER_PERMISSION_KEYS.TOPICS_VIEW_SELF },
  { prefix: "/saved", permission: LAWYER_PERMISSION_KEYS.SAVED_VIEW_SELF },
  { prefix: "/cases/new", permission: LAWYER_PERMISSION_KEYS.CASES_CREATE_DRAFT },
  { prefix: "/cases/mine", permission: LAWYER_PERMISSION_KEYS.CASES_VIEW_OWN_DASHBOARD },
  { prefix: "/cases/saved", permission: LAWYER_PERMISSION_KEYS.CASES_VIEW_SAVED_OWN },
  { prefix: "/cases/", permission: LAWYER_PERMISSION_KEYS.CASES_VIEW },
  { prefix: "/cases", permission: LAWYER_PERMISSION_KEYS.CASES_VIEW },
  { prefix: "/discussions/", permission: LAWYER_PERMISSION_KEYS.DISCUSSIONS_VIEW },
  { prefix: "/discussions", permission: LAWYER_PERMISSION_KEYS.DISCUSSIONS_VIEW },
];

export function normalizeRoleName(roleName: string) {
  return roleName.trim().toLowerCase();
}

export function canAccessAdminPortal(roles: string[]) {
  return roles.some((role) => ADMIN_PORTAL_ROLES.has(normalizeRoleName(role)));
}

export function canAccessLawyerPortal(roles: string[]) {
  return roles.some((role) => LAWYER_PORTAL_ROLES.has(normalizeRoleName(role)));
}

export function resolveEffectivePermissions(roles: string[], assignedPermissionKeys: string[] = []) {
  const normalizedAssigned = Array.from(
    new Set(
      assignedPermissionKeys
        .map((permissionKey) => permissionKey.trim())
        .filter(Boolean),
    ),
  ).sort();

  const resolved = new Set<string>();

  for (const role of roles.map(normalizeRoleName)) {
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role];
    if (!defaultPermissions) continue;

    for (const permissionKey of defaultPermissions) {
        resolved.add(permissionKey);
    }
  }

  for (const permissionKey of normalizedAssigned) {
    resolved.add(permissionKey);
  }

  return Array.from(resolved).sort();
}

export function hasPermission(permissionKeys: string[], permissionKey: string) {
  return permissionKeys.includes(permissionKey);
}

export function hasAnyPermission(permissionKeys: string[], permissionRequirements: string[]) {
  return permissionRequirements.some((permissionKey) => hasPermission(permissionKeys, permissionKey));
}

export function canAccessPermissionRequirement(permissionKeys: string[], permissionRequirement: PermissionRequirement) {
  return Array.isArray(permissionRequirement)
    ? hasAnyPermission(permissionKeys, permissionRequirement)
    : hasPermission(permissionKeys, permissionRequirement);
}

export function canAccessAdminPermission(roles: string[], permissionKeys: string[], permissionKey: string) {
  if (!canAccessAdminPortal(roles)) {
    return false;
  }

  return hasPermission(resolveEffectivePermissions(roles, permissionKeys), permissionKey);
}

export function canAccessLawyerPermission(roles: string[], permissionKeys: string[], permissionKey: string) {
  if (!canAccessLawyerPortal(roles)) {
    return false;
  }

  return hasPermission(resolveEffectivePermissions(roles, permissionKeys), permissionKey);
}

export function getAdminPermissionForPath(pathname: string) {
  const matchedRule = ADMIN_ROUTE_PERMISSION_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );

  return matchedRule?.permission ?? null;
}

export function getLawyerPermissionForPath(pathname: string) {
  const matchedRule = LAWYER_ROUTE_PERMISSION_RULES.find(
    (rule) =>
      pathname === rule.prefix ||
      pathname.startsWith(`${rule.prefix}/`) ||
      (rule.prefix.endsWith("/") && pathname.startsWith(rule.prefix)),
  );

  return matchedRule?.permission ?? null;
}

export function canAccessLawyerPath(roles: string[], permissionKeys: string[], pathname: string) {
  if (!canAccessLawyerPortal(roles)) {
    return false;
  }

  const requiredPermission = getLawyerPermissionForPath(pathname);
  if (!requiredPermission) {
    return true;
  }

  return canAccessPermissionRequirement(resolveEffectivePermissions(roles, permissionKeys), requiredPermission);
}

export function getFirstAccessibleAdminPath(roles: string[], permissionKeys: string[]) {
  if (!canAccessAdminPortal(roles)) {
    return null;
  }

  const matchedRule = ADMIN_ROUTE_PERMISSION_RULES.find((rule) =>
    canAccessAdminPermission(roles, permissionKeys, rule.permission),
  );

  return matchedRule?.prefix ?? "/adminprofile";
}

export function getFirstAccessibleLawyerPath(roles: string[], permissionKeys: string[]) {
  if (!canAccessLawyerPortal(roles)) {
    return null;
  }

  const effectivePermissions = resolveEffectivePermissions(roles, permissionKeys);
  const matchedRule = LAWYER_ROUTE_PERMISSION_RULES.find((rule) =>
    canAccessPermissionRequirement(effectivePermissions, rule.permission),
  );

  return matchedRule?.prefix ?? null;
}
