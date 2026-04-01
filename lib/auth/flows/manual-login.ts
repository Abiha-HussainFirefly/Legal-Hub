import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/normalize";
import { verifyPassword } from "@/lib/auth/password";
import { sharedAuthLookup, isUserActive } from "@/lib/auth/auth-lookup";
import { createSession } from "@/lib/auth/session";
import { AuthError, ManualLoginInput, SessionResult } from "../types";

export async function manualLogin(
  prisma: PrismaClient,
  input: ManualLoginInput
): Promise<SessionResult> {
  const normalizedEmail = normalizeEmail(input.email);

  // READ UserIdentifier EMAIL
  const lookup = await sharedAuthLookup(prisma, normalizedEmail);

  if (lookup.userIdentifier === null || lookup.user === null) {
   
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

    throw new AuthError(
      "INVALID_CREDENTIALS",
      "No account found for this email",
      "Invalid email or password."
    );
  }

  const { user, roles: _roles, credential, googleAccount } = lookup;

  // User ACTIVE and not deleted?
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

  //  Credential exists?
 
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

  // Verify password hash

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

  const sessionResult = await prisma.$transaction(async (tx) => {
    // INSERT Session
   
    const session = await createSession(tx as any, {
      userId: user.id,
      ip: input.ip,
      userAgent: input.userAgent,
      deviceLabel: input.deviceLabel,
    });

    // UPDATE User login metadata
    await tx.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: input.ip ?? null,
        lastUserAgent: input.userAgent ?? null,
      },
    });

    // INSERT AuditLog LOGIN_SUCCESS
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
      sessionToken: session.sessionToken,   
      userId: user.id,
      expiresAt: session.expiresAt,
    };
  });

  
  return sessionResult;
}
