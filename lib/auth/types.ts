
export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly userMessage: string = message
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthErrorCode =
  | "EMAIL_ALREADY_EXISTS"
  | "ADMIN_EMAIL_CONFLICT"
  | "GOOGLE_ONLY_ACCOUNT"
  | "ACCOUNT_ALREADY_EXISTS"
  | "INCONSISTENT_IDENTITY"
  | "ADMIN_GOOGLE_BLOCKED"
  | "ACCOUNT_BLOCKED"
  | "INVALID_CREDENTIALS"
  | "INVALID_TOKEN"
  | "INVALID_TOKEN_PURPOSE"
  | "TOKEN_EXPIRED_OR_USED"
  | "GOOGLE_PROVIDER_MISMATCH";



export interface ManualRegisterInput {
  email: string;
  password: string;          
  displayName: string;
  locale?: string;
  timeZone?: string;
}

export interface ManualLoginInput {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
  deviceLabel?: string;
}

export interface GoogleAuthInput {
  googleSub: string;          
  email: string;              
  displayName?: string;
  avatarUrl?: string;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  expiresAt?: number;         
  ip?: string;
  userAgent?: string;
  deviceLabel?: string;
}

export interface EmailVerifyInput {
  token: string;              
}

export interface AdminProvisionInput {
  email: string;
  password: string;           
  displayName: string;
  locale?: string;
  timeZone?: string;
  actorUserId: string;       
  trustEmailAtProvisioning?: boolean;
}

export interface SessionResult {
  sessionToken: string;
  userId: string;
  expiresAt: Date;
}

export interface RegisterResult {
  userId: string;
  message: string;            
}

export interface AdminProvisionResult {
  userId: string;
}

export interface EmailVerifyResult {
  userId: string;
}
