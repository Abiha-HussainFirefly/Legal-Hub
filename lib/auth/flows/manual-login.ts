import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/normalize";
import { verifyPassword } from "@/lib/auth/password";
import { sharedAuthLookup, isUserActive } from "@/lib/auth/auth-lookup";
import { createSession } from "@/lib/auth/session";
import { AuthError, ManualLoginInput, SessionResult } from "../types";

/**
 * Manual Login Flow
 *
 * Covers (per PDF + diagram):
 *  - Admin manual login            → allowed
 *  - Member manual login           → allowed
 *  - Hybrid account manual login   → allowed
 *  - Google-only account           → blocked with specific message
 *  - Suspended / deleted user      → blocked
 *  - Unknown email / wrong password→ invalid credentials (same message for both — no enumeration)
 *
 * Flow (matches diagram exactly):
 *  1. Normalize email
 *  2. READ UserIdentifier EMAIL
 *  3. Not found → (optional AuditLog LOGIN_FAILED) → STOP: invalid credentials
 *  4. Found → READ User + Role + Credential + ExternalAccount
 *  5. User ACTIVE and not deleted?
 *     No  → INSERT AuditLog LOGIN_FAILED → STOP: account blocked
 *  6. Credential exists?
 *     No  → INSERT AuditLog LOGIN_FAILED → STOP: "created with Google Auth"
 *  7. Verify password hash
 *     No  → INSERT AuditLog LOGIN_FAILED → STOP: invalid credentials
 *  8. TX BEGIN
 *  9. INSERT Session
 * 10. UPDATE User.lastLoginAt, lastLoginIp, lastUserAgent
 * 11. INSERT AuditLog LOGIN_SUCCESS
 * 12. TX COMMIT
 * 13. Return login success
 */
export async function manualLogin(
  prisma: PrismaClient,
  input: ManualLoginInput
): Promise<SessionResult> {
  const normalizedEmail = normalizeEmail(input.email);

  // Steps 2–3 — READ UserIdentifier EMAIL
  const lookup = await sharedAuthLookup(prisma, normalizedEmail);

  if (lookup.userIdentifier === null || lookup.user === null) {
    // Optional audit log for unknown email (low-noise environments may skip this)
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        actorId: null,
        targetUserId: null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason: "invalid_credentials",
          email: normalizedEmail,
        },
      },
    });

    // Use the same message as wrong-password to prevent email enumeration
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "No account found for this email",
      "Invalid email or password."
    );
  }

  const { user, roles: _roles, credential, googleAccount } = lookup;

  // Step 5 — User ACTIVE and not deleted?
  if (!isUserActive(user)) {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        actorId: null,
        targetUserId: user.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason: "blocked_status",
          email: normalizedEmail,
        },
      },
    });

    throw new AuthError(
      "ACCOUNT_BLOCKED",
      "Account is not active",
      "Your account has been suspended or disabled. Please contact support."
    );
  }

  // Step 6 — Credential exists?
  // No credential means this is a Google-only account
  if (credential === null) {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        actorId: null,
        targetUserId: user.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason: "google_only_account",
          email: normalizedEmail,
        },
      },
    });

    throw new AuthError(
      "GOOGLE_ONLY_ACCOUNT",
      "Account has no password credential — Google-only",
      "This account was created with Google Auth. Please login with Google Auth."
    );
  }

  // Step 7 — Verify password hash
  // IMPORTANT: their verifyPassword signature is (plaintext, hash) — NOT (hash, plaintext)
  const passwordValid = await verifyPassword(input.password, credential.passwordHash);

  if (!passwordValid) {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        actorId: null,
        targetUserId: user.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason: "invalid_credentials",
          email: normalizedEmail,
        },
      },
    });

    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Password verification failed",
      "Invalid email or password."
    );
  }

  // Steps 8–12 — single atomic transaction (session creation boundary)
  const sessionResult = await prisma.$transaction(async (tx) => {
    // Step 9 — INSERT Session
    // Their createSession(db, input) returns the session object directly.
    // The token lives at session.sessionToken, expiry at session.expiresAt.
    const session = await createSession(tx as any, {
      userId: user.id,
      ip: input.ip,
      userAgent: input.userAgent,
      deviceLabel: input.deviceLabel,
    });

    // Step 10 — UPDATE User login metadata
    await tx.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: input.ip ?? null,
        lastUserAgent: input.userAgent ?? null,
      },
    });

    // Step 11 — INSERT AuditLog LOGIN_SUCCESS
    await tx.auditLog.create({
      data: {
        action: "LOGIN_SUCCESS",
        actorId: user.id,
        targetUserId: user.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          sessionId: session.id,
          ip: input.ip ?? null,
        },
      },
    });

    return {
      sessionToken: session.sessionToken,   // raw token stored on the session row
      userId: user.id,
      expiresAt: session.expiresAt,
    };
  });

  // Step 13 — Return login success
  return sessionResult;
}
