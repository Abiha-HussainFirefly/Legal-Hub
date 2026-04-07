import { isUserActive, sharedAuthLookup } from "@/lib/auth/auth-lookup";
import { normalizeEmail } from "@/lib/auth/normalize";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { AuthError, ManualLoginInput, SessionResult } from "@/lib/auth/types";
import { PrismaClient } from "@prisma/client";

export async function manualLogin(
  prisma: PrismaClient,
  input: ManualLoginInput
): Promise<SessionResult> {
  const normalizedEmail = normalizeEmail(input.email);

 
  const lookup = await sharedAuthLookup(prisma, normalizedEmail);

 
  if (lookup.userIdentifier === null || lookup.user === null) {
    await prisma.auditLog.create({
      data: {
        action:       "LOGIN_FAILED",
        actorId:      null,
        targetUserId: null,
        ip:           input.ip        ?? null,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason:     "invalid_credentials",
          email:      normalizedEmail,
        },
      },
    });

    throw new AuthError(
      "INVALID_CREDENTIALS",
      "No account found for this email",
      "Invalid email or password."
    );
  }

  const { user, credential, googleAccount } = lookup;

 
  if (!isUserActive(user)) {
    await prisma.auditLog.create({
      data: {
        action:       "LOGIN_FAILED",
        actorId:      user.id,
        targetUserId: user.id,
        ip:           input.ip        ?? null,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason:     "blocked_status",
          email:      normalizedEmail,
        },
      },
    });

    throw new AuthError(
      "ACCOUNT_BLOCKED",
      "Account is not active",
      "Your account has been suspended or disabled. Please contact support."
    );
  }


  if (credential === null && googleAccount !== null) {
    await prisma.auditLog.create({
      data: {
        action:       "LOGIN_FAILED",
        actorId:      user.id,
        targetUserId: user.id,
        ip:           input.ip        ?? null,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason:     "google_only_account",
          email:      normalizedEmail,
        },
      },
    });

    throw new AuthError(
      "GOOGLE_ONLY_ACCOUNT",
      "Account has no password credential — Google-only",
      "This account was created with Google Auth. Please login with Google Auth."
    );
  }

 
  if (credential === null) {
    await prisma.auditLog.create({
      data: {
        action:       "LOGIN_FAILED",
        actorId:      user.id,
        targetUserId: user.id,
        ip:           input.ip        ?? null,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason:     "no_credential",
          email:      normalizedEmail,
        },
      },
    });

    throw new AuthError(
      "INVALID_CREDENTIALS",
      "No credential found for this account",
      "Invalid email or password."
    );
  }

  
  const passwordValid = await verifyPassword(input.password, credential.passwordHash);

  if (!passwordValid) {
    await prisma.auditLog.create({
      data: {
        action:       "LOGIN_FAILED",
        actorId:      user.id,   
        targetUserId: user.id,
        ip:           input.ip        ?? null,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          reason:     "invalid_credentials",
          email:      normalizedEmail,
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
    const session = await createSession(tx as any, {
      userId:      user.id,
      ip:          input.ip,
      userAgent:   input.userAgent,
      deviceLabel: input.deviceLabel,
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt:   new Date(),
        lastLoginIp:   input.ip        ?? null,
        lastUserAgent: input.userAgent ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        action:       "LOGIN_SUCCESS",
        actorId:      user.id,
        targetUserId: user.id,
        ip:           input.ip        ?? null,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "manual",
          sessionId:  session.id,
          ip:         input.ip ?? null,
        },
      },
    });

    return {
      sessionToken: session.sessionToken,
      userId:       user.id,
      expiresAt:    session.expiresAt,
    };
  });

  return sessionResult;
}
