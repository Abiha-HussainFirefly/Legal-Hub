import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/normalize";
import { createSession } from "@/lib/auth/session";
import { isUserActive, isAdmin } from "@/lib/auth/auth-lookup";
import { AuthError, GoogleAuthInput, SessionResult } from "../types";

/**
 * Google Registration / Login Flow — Public Users
 *
 * Covers all four branches (per PDF + diagram):
 *
 * Branch A — Existing Google account (providerAccountId match)
 *   → update lastUsedAt, create Session, update User, audit LOGIN_SUCCESS
 *
 * Branch B — New Google user (no identifier found)
 *   → INSERT User + UserIdentifier (verifiedAt=now) + ExternalAccount
 *   + UserRole(member) + Session + AuditLog(USER_CREATED + LOGIN_SUCCESS)
 *
 * Branch C — Existing manual-only user logs in with Google (same email, no Google account yet)
 *   → Link: INSERT ExternalAccount, UPDATE verifiedAt if null, Session, audit LOGIN_SUCCESS
 *
 * Branch D — Email exists but Google providerAccountId is different
 *   → Security mismatch: audit LOGIN_FAILED, STOP
 *
 * Admin block (diagram 1):
 *   → Google auth resolved to existing user → READ UserRole
 *   → Role admin? YES → INSERT AuditLog LOGIN_FAILED
 *   → STOP: "Admin accounts support manual login only."
 *
 * Rules:
 *  - Google login is allowed only for non-admin users
 *  - Google email is treated as verified identity (verifiedAt=now on first Google signup)
 *  - Do NOT create a second User record
 *
 * NOTE on createSession:
 *  Their createSession(db, input) returns the Prisma session object directly.
 *  Token lives at session.sessionToken, expiry at session.expiresAt.
 */
export async function googleAuth(
  prisma: PrismaClient,
  input: GoogleAuthInput
): Promise<SessionResult> {
  const normalizedEmail = normalizeEmail(input.email);

  // ── Step 1: Check by providerAccountId first (Branch A fast path) ──────────
  const existingExternalAccount = await prisma.externalAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: input.googleSub,
      },
    },
    select: { id: true, userId: true, providerAccountId: true },
  });

  if (existingExternalAccount) {
    // ── BRANCH A: Existing Google account ─────────────────────────────────────
    return await handleBranchA(prisma, existingExternalAccount.userId, input);
  }

  // ── Step 2: No providerAccountId match — look up by email ──────────────────
  const userIdentifier = await prisma.userIdentifier.findUnique({
    where: { type_value: { type: "EMAIL", value: normalizedEmail } },
    select: { userId: true },
  });

  if (!userIdentifier) {
    // ── BRANCH B: Completely new Google user ──────────────────────────────────
    return await handleBranchB(prisma, normalizedEmail, input);
  }

  // Email exists — load full profile to determine branch
  const userId = userIdentifier.userId;

  const [user, userRoles, existingGoogleAccount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, deletedAt: true, displayName: true },
    }),
    prisma.userRole.findMany({
      where: { userId },
      include: { role: { select: { name: true } } },
    }),
    prisma.externalAccount.findFirst({
      where: { userId, provider: "google" },
      select: { id: true, providerAccountId: true },
    }),
  ]);

  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "User not found", "Authentication failed.");
  }

  const roles = userRoles.map((ur) => ur.role.name);

  // Admin block — applies to all existing-user branches (diagram 1)
  if (isAdmin(roles)) {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        actorId: null,
        targetUserId: user.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "google",
          reason: "admin_google_block",
          email: normalizedEmail,
        },
      },
    });
    throw new AuthError(
      "ADMIN_GOOGLE_BLOCKED",
      "Admin attempted Google login",
      "Admin accounts support manual login only."
    );
  }

  if (!isUserActive(user)) {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        actorId: null,
        targetUserId: user.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: { authMethod: "google", reason: "blocked_status", email: normalizedEmail },
      },
    });
    throw new AuthError(
      "ACCOUNT_BLOCKED",
      "Account is not active",
      "Your account has been suspended or disabled."
    );
  }

  if (existingGoogleAccount) {
    // ── BRANCH D: providerAccountId mismatch — security block ─────────────────
    if (existingGoogleAccount.providerAccountId !== input.googleSub) {
      await prisma.auditLog.create({
        data: {
          action: "LOGIN_FAILED",
          actorId: null,
          targetUserId: user.id,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          meta: {
            authMethod: "google",
            reason: "google_provider_mismatch",
            email: normalizedEmail,
            providerAccountId: input.googleSub,
          },
        },
      });
      throw new AuthError(
        "GOOGLE_PROVIDER_MISMATCH",
        "Google providerAccountId mismatch for this email",
        "Authentication failed. Please contact support."
      );
    }
    // Logically unreachable (step 1 would have caught it) — defensive fallback
    return await handleBranchA(prisma, user.id, input);
  }

  // ── BRANCH C: Existing manual-only user logs in with Google ─────────────────
  return await handleBranchC(prisma, user.id, normalizedEmail, input);
}

// ────────────────────────────────────────────────────────────────────────────
// Branch A — Existing Google account
// ────────────────────────────────────────────────────────────────────────────
async function handleBranchA(
  prisma: PrismaClient,
  userId: string,
  input: GoogleAuthInput
): Promise<SessionResult> {
  // READ User + UserRole to enforce admin block
  const [user, userRoles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, deletedAt: true },
    }),
    prisma.userRole.findMany({
      where: { userId },
      include: { role: { select: { name: true } } },
    }),
  ]);

  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "User not found", "Authentication failed.");
  }

  const roles = userRoles.map((ur) => ur.role.name);

  // Admin block (diagram 1)
  if (isAdmin(roles)) {
    await prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        actorId: null,
        targetUserId: userId,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: { authMethod: "google", reason: "admin_google_block" },
      },
    });
    throw new AuthError(
      "ADMIN_GOOGLE_BLOCKED",
      "Admin attempted Google login",
      "Admin accounts support manual login only."
    );
  }

  if (!isUserActive(user)) {
    throw new AuthError("ACCOUNT_BLOCKED", "Account is not active", "Your account has been disabled.");
  }

  return await prisma.$transaction(async (tx) => {
    // UPDATE ExternalAccount.lastUsedAt
    await tx.externalAccount.updateMany({
      where: { userId, provider: "google" },
      data: { lastUsedAt: new Date() },
    });

    // INSERT Session — createSession returns session object directly
    const session = await createSession(tx as any, {
      userId,
      ip: input.ip,
      userAgent: input.userAgent,
      deviceLabel: input.deviceLabel,
    });

    // UPDATE User login metadata
    await tx.user.update({
      where: { id: userId },
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
        actorId: userId,
        targetUserId: userId,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "google",
          provider: "google",
          sessionId: session.id,
          ip: input.ip ?? null,
        },
      },
    });

    return {
      sessionToken: session.sessionToken,
      userId,
      expiresAt: session.expiresAt,
    };
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Branch B — New Google user
// ────────────────────────────────────────────────────────────────────────────
async function handleBranchB(
  prisma: PrismaClient,
  normalizedEmail: string,
  input: GoogleAuthInput
): Promise<SessionResult> {
  return await prisma.$transaction(async (tx) => {
    // INSERT User
    const user = await tx.user.create({
      data: {
        userType: "EXTERNAL",
        status: "ACTIVE",
        displayName: input.displayName ?? normalizedEmail,
        avatarUrl: input.avatarUrl ?? null,
        lastLoginAt: new Date(),
        lastLoginIp: input.ip ?? null,
        lastUserAgent: input.userAgent ?? null,
      },
    });

    // INSERT UserIdentifier — verifiedAt=now() because Google email is verified identity
    await tx.userIdentifier.create({
      data: {
        userId: user.id,
        type: "EMAIL",
        value: normalizedEmail,
        isPrimary: true,
        verifiedAt: new Date(),
      },
    });

    // INSERT ExternalAccount
    await tx.externalAccount.create({
      data: {
        userId: user.id,
        providerType: "OAUTH",
        provider: "google",
        providerAccountId: input.googleSub,
        providerEmail: normalizedEmail,
        providerDisplayName: input.displayName ?? null,
        providerAvatarUrl: input.avatarUrl ?? null,
        idToken: input.idToken ?? null,
        accessToken: input.accessToken ?? null,
        refreshToken: input.refreshToken ?? null,
        scope: input.scope ?? null,
        expiresAt: input.expiresAt ?? null,
        linkedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    // READ Role(member)
    const memberRole = await tx.role.findUnique({ where: { name: "member" } });
    if (!memberRole) {
      throw new Error("Role 'member' not found. Run your seed script.");
    }

    // INSERT UserRole(member)
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: memberRole.id,
        assignedBy: null,
      },
    });

    // INSERT Session — createSession returns session object directly
    const session = await createSession(tx as any, {
      userId: user.id,
      ip: input.ip,
      userAgent: input.userAgent,
      deviceLabel: input.deviceLabel,
    });

    // INSERT AuditLog USER_CREATED
    await tx.auditLog.create({
      data: {
        action: "USER_CREATED",
        actorId: null,
        targetUserId: user.id,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          registrationMethod: "google",
          email: normalizedEmail,
          role: "member",
        },
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
          authMethod: "google",
          provider: "google",
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
}

// ────────────────────────────────────────────────────────────────────────────
// Branch C — Existing manual-only user logs in with Google (account linking)
// ────────────────────────────────────────────────────────────────────────────
async function handleBranchC(
  prisma: PrismaClient,
  userId: string,
  normalizedEmail: string,
  input: GoogleAuthInput
): Promise<SessionResult> {
  return await prisma.$transaction(async (tx) => {
    // INSERT ExternalAccount — link Google to the existing User
    await tx.externalAccount.create({
      data: {
        userId,
        providerType: "OAUTH",
        provider: "google",
        providerAccountId: input.googleSub,
        providerEmail: normalizedEmail,
        providerDisplayName: input.displayName ?? null,
        providerAvatarUrl: input.avatarUrl ?? null,
        idToken: input.idToken ?? null,
        accessToken: input.accessToken ?? null,
        refreshToken: input.refreshToken ?? null,
        scope: input.scope ?? null,
        expiresAt: input.expiresAt ?? null,
        linkedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    // UPDATE UserIdentifier.verifiedAt if null (Google confirms the email)
    const existingIdentifier = await tx.userIdentifier.findUnique({
      where: { type_value: { type: "EMAIL", value: normalizedEmail } },
      select: { verifiedAt: true },
    });

    if (!existingIdentifier?.verifiedAt) {
      await tx.userIdentifier.update({
        where: { type_value: { type: "EMAIL", value: normalizedEmail } },
        data: { verifiedAt: new Date() },
      });
    }

    // INSERT Session — createSession returns session object directly
    const session = await createSession(tx as any, {
      userId,
      ip: input.ip,
      userAgent: input.userAgent,
      deviceLabel: input.deviceLabel,
    });

    // UPDATE User login metadata
    await tx.user.update({
      where: { id: userId },
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
        actorId: userId,
        targetUserId: userId,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        meta: {
          authMethod: "google",
          provider: "google",
          sessionId: session.id,
          ip: input.ip ?? null,
        },
      },
    });

    return {
      sessionToken: session.sessionToken,
      userId,
      expiresAt: session.expiresAt,
    };
  });
}
