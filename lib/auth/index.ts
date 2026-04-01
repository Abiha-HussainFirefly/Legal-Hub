
export { manualRegister }        from "@/lib/auth/flows/manual-register";
export { manualLogin }           from "@/lib/auth/flows/manual-login";
export { googleAuth }            from "@/lib/auth/flows/google-auth";
export { verifyEmail }           from "@/lib/auth/flows/email-verify";
export { provisionAdminAccount } from "@/lib/auth/flows/admin-provision";

export { sharedAuthLookup, isUserActive, isAdmin } from "@/lib/auth/auth-lookup";
export { normalizeEmail }        from "@/lib/auth/normalize";
export { hashPassword, verifyPassword } from "@/lib/auth/password";
export { createSession }         from "@/lib/auth/session";
export { generateToken }         from "@/lib/auth/token";

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
