export const PERMISSIONS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_REGISTER: 'auth.register',
  AUTH_PASSWORD_RESET: 'auth.password.reset',
  AUTH_EMAIL_VERIFY: 'auth.email.verify',
  ACCOUNT_VIEW_SELF: 'account.view.self',
  ACCOUNT_EDIT_SELF: 'account.edit.self',
  ACCOUNT_PASSWORD_CHANGE_SELF: 'account.password.change.self',
  PROFILE_VIEW_SELF: 'profile.view.self',
  PROFILE_SETUP_SELF: 'profile.setup.self',
  PROFILE_EDIT_SELF: 'profile.edit.self',
  PROFILE_STATS_VIEW_SELF: 'profile.stats.view.self',
  PROFILE_VISIBILITY_MANAGE_SELF: 'profile.visibility.manage.self',
  PROFILE_PUBLIC_VIEW: 'profile.public.view',
  PROFILE_VIEW_TRACK: 'profile.view.track',
  DISCUSSIONS_VIEW: 'discussions.view',
  DISCUSSIONS_CREATE: 'discussions.create',
  DISCUSSIONS_EDIT_OWN: 'discussions.edit.own',
  DISCUSSIONS_DELETE_OWN: 'discussions.delete.own',
  DISCUSSIONS_VIEW_OWN: 'discussions.view.own',
  DISCUSSIONS_VIEW_SAVED_OWN: 'discussions.view.saved_own',
  DISCUSSIONS_BOOKMARK: 'discussions.bookmark',
  DISCUSSIONS_FOLLOW: 'discussions.follow',
  DISCUSSIONS_REACT: 'discussions.react',
  DISCUSSIONS_AI_SUMMARY_VIEW: 'discussions.ai_summary.view',
  ANSWERS_VIEW: 'answers.view',
  ANSWERS_CREATE: 'answers.create',
  ANSWERS_REACT: 'answers.react',
  ANSWERS_ACCEPT_ON_OWN_DISCUSSION: 'answers.accept.on_own_discussion',
  COMMENTS_VIEW: 'comments.view',
  COMMENTS_CREATE: 'comments.create',
  COMMENTS_REACT: 'comments.react',
  NOTIFICATIONS_VIEW_SELF: 'notifications.view.self',
  NOTIFICATIONS_MARK_READ_SELF: 'notifications.mark_read.self',
  CASES_VIEW: 'cases.view',
  CASES_META_VIEW: 'cases.meta.view',
  CASES_CREATE_DRAFT: 'cases.create.draft',
  CASES_VIEW_OWN_DASHBOARD: 'cases.view.own_dashboard',
  CASES_VIEW_OWN_UNPUBLISHED: 'cases.view.own_unpublished',
  CASES_EDIT_OWN: 'cases.edit.own',
  CASES_SUBMIT_OWN_FOR_REVIEW: 'cases.submit.own_for_review',
  CASES_BOOKMARK: 'cases.bookmark',
  CASES_VIEW_SAVED_OWN: 'cases.view.saved_own',
  CASES_SHARE: 'cases.share',
  SAVED_VIEW_SELF: 'saved.view.self',
  TOPICS_VIEW_SELF: 'topics.view.self',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const normalizePermissions = (permissions: Permission[] | null | undefined): Permission[] =>
  (Array.isArray(permissions) ? permissions : []);

export const hasPermission = (
  permissions: Permission[] | null | undefined,
  permission: Permission | null | undefined,
): boolean => {
  if (!permission) {
    return false;
  }

  return normalizePermissions(permissions).includes(permission);
};

export const hasAllPermissions = (
  permissions: Permission[] | null | undefined,
  requiredPermissions: Permission[] = [],
): boolean => {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
    return false;
  }

  return requiredPermissions.every((permission) => hasPermission(permissions, permission));
};

export const hasAnyPermission = (
  permissions: Permission[] | null | undefined,
  requiredPermissions: Permission[] = [],
): boolean => {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
    return false;
  }

  return requiredPermissions.some((permission) => hasPermission(permissions, permission));
};
