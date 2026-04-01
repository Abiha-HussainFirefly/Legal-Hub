// ─────────────────────────────────────────────
//  Auth System — Public API
//  Import everything from here, not from individual files
// ─────────────────────────────────────────────

export { manualRegister }        from "./flows/manual-register";
export { manualLogin }           from "./flows/manual-login";
export { googleAuth }            from "./flows/google-auth";
export { verifyEmail }           from "./flows/email-verify";
export { provisionAdminAccount } from "./flows/admin-provision";

export { sharedAuthLookup, isUserActive, isAdmin } from "./lib/auth-lookup";
export { normalizeEmail }        from "./lib/normalize";
export { hashPassword, verifyPassword } from "./lib/password";
export { createSession }         from "./lib/session";
export { generateToken }         from "./lib/token";

export type {
  AuthErrorCode,
  ManualRegisterInput,
  ManualLoginInput,
  GoogleAuthInput,
  EmailVerifyInput,
  AdminProvisionInput,
  SessionResult,
  RegisterResult,
  AdminProvisionResult,
  EmailVerifyResult,
} from "./types";

export { AuthError } from "./types";
