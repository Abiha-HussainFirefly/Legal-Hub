import { PrismaClient }                              from "@prisma/client";
import { hashAuditIp }                               from "@/lib/auth/audit";
import { normalizeEmail }                            from "@/lib/auth/normalize";
import { createSession }                             from "@/lib/auth/session";
import { isUserActive, isAdmin }                     from "@/lib/auth/auth-lookup";
import { AuthError, GoogleAuthInput, SessionResult } from "@/lib/auth/types";
 

export async function googleAuth(
  prisma: PrismaClient,
  input: GoogleAuthInput
): Promise<SessionResult> {
  const normalizedEmail = normalizeEmail(input.email);
  const ipHash = hashAuditIp(input.ip);
 
  
  const existingExternalAccount = await prisma.externalAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider:          "google",
        providerAccountId: input.googleSub,
      },
    },
    select: { id: true, userId: true, providerAccountId: true },
  });
 
  if (existingExternalAccount) {
    
    return await handleBranchA(prisma, existingExternalAccount.userId, input);
  }
 
  const userIdentifier = await prisma.userIdentifier.findUnique({
    where: {
      type_normalizedValue: {
        type: "EMAIL",
        normalizedValue: normalizedEmail,
      },
    },
    select: { userId: true },
  });
 
  if (!userIdentifier) {
    
    return await handleBranchB(prisma, normalizedEmail, input);
  }
 
 
  const userId = userIdentifier.userId;
 
  const [user, userRoles, existingGoogleAccount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id:          true,
        userType:    true,   
        status:      true,
        displayName: true,
        deletedAt:   true,
        lastLoginAt: true,   
      },
    }),
    prisma.userRole.findMany({
      where:   { userId },
      include: { role: { select: { name: true } } },
    }),
    prisma.externalAccount.findFirst({
      where:  { userId, provider: "google" },
      select: { id: true, providerAccountId: true },
    }),
  ]);
 
  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "User not found", "Authentication failed.");
  }
 
  const roles = userRoles.map((ur) => ur.role.name);
 
  
  if (isAdmin(roles)) {
    await prisma.auditLog.create({
      data: {
        category:     "AUTH",
        action:       "LOGIN_FAILED",
        actorId:      null,
        targetUserId: user.id,
        ipHash,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "google",
          reason:     "admin_google_block",
          email:      normalizedEmail,
        },
      },
    });
    throw new AuthError(
      "ADMIN_GOOGLE_BLOCKED",
      "Admin attempted Google login",
      "Admin accounts support manual login only."
    );
  }
 
  // Account status check 
  if (!isUserActive(user)) {
    await prisma.auditLog.create({
      data: {
        category:     "AUTH",
        action:       "LOGIN_FAILED",
        actorId:      null,
        targetUserId: user.id,
        ipHash,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "google",
          reason:     "blocked_status",
          email:      normalizedEmail,
        },
      },
    });
    throw new AuthError(
      "ACCOUNT_BLOCKED",
      "Account is not active",
      "Your account has been suspended or disabled."
    );
  }
 
  if (existingGoogleAccount) {
    
    if (existingGoogleAccount.providerAccountId !== input.googleSub) {
      await prisma.auditLog.create({
        data: {
          category:     "AUTH",
          action:       "LOGIN_FAILED",
          actorId:      null,
          targetUserId: user.id,
          ipHash,
          userAgent:    input.userAgent ?? null,
          meta: {
            authMethod:        "google",
            reason:            "google_provider_mismatch",
            email:             normalizedEmail,
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
    
    return await handleBranchA(prisma, user.id, input);
  }
 
  
  return await handleBranchC(prisma, user.id, normalizedEmail, input);
}
 
async function handleBranchA(
  prisma: PrismaClient,
  userId: string,
  input: GoogleAuthInput
): Promise<SessionResult> {
  const ipHash = hashAuditIp(input.ip);
  const [user, userRoles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id:          true,
        userType:    true,   
        status:      true,
        displayName: true,
        deletedAt:   true,
        lastLoginAt: true,   
      },
    }),
    prisma.userRole.findMany({
      where:   { userId },
      include: { role: { select: { name: true } } },
    }),
  ]);
 
  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "User not found", "Authentication failed.");
  }
 
  const roles = userRoles.map((ur) => ur.role.name);
 
  if (isAdmin(roles)) {
    await prisma.auditLog.create({
      data: {
        category:     "AUTH",
        action:       "LOGIN_FAILED",
        actorId:      null,
        targetUserId: userId,
        ipHash,
        userAgent:    input.userAgent ?? null,
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
    throw new AuthError(
      "ACCOUNT_BLOCKED",
      "Account is not active",
      "Your account has been disabled."
    );
  }
 
  return await prisma.$transaction(async (tx) => {
    // UPDATE ExternalAccount.lastUsedAt
    await tx.externalAccount.updateMany({
      where: { userId, provider: "google" },
      data:  { lastUsedAt: new Date() },
    });
 
    // INSERT Session
    const session = await createSession(tx, {
      userId,
      ip:          input.ip,
      userAgent:   input.userAgent,
      deviceLabel: input.deviceLabel,
    });
 
    // UPDATE User login metadata
    await tx.user.update({
      where: { id: userId },
      data: {
        lastLoginAt:   new Date(),
        lastLoginIp:   input.ip ?? null,
        lastUserAgent: input.userAgent ?? null,
      },
    });
 
    // INSERT AuditLog LOGIN_SUCCESS
    await tx.auditLog.create({
      data: {
        category:     "AUTH",
        action:       "LOGIN_SUCCESS",
        actorId:      userId,
        targetUserId: userId,
        ipHash,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "google",
          provider:   "google",
          sessionId:  session.id,
          ipHash,
        },
      },
    });
 
    return {
      sessionToken: session.sessionToken,
      userId,
      expiresAt:    session.expiresAt,
    };
  });
}
 
// New Google user
async function handleBranchB(
  prisma: PrismaClient,
  normalizedEmail: string,
  input: GoogleAuthInput
): Promise<SessionResult> {
  const ipHash = hashAuditIp(input.ip);
  return await prisma.$transaction(async (tx) => {
    // INSERT User
    const user = await tx.user.create({
      data: {
        userType:      "EXTERNAL",
        status:        "ACTIVE",
        displayName:   input.displayName ?? normalizedEmail,
        avatarUrl:     input.avatarUrl   ?? null,
        lastLoginAt:   new Date(),
        lastLoginIp:   input.ip          ?? null,
        lastUserAgent: input.userAgent   ?? null,
      },
    });
 
    // INSERT UserIdentifier — verifiedAt=now() because Google proves email ownership
    await tx.userIdentifier.create({
      data: {
        userId:     user.id,
        type:       "EMAIL",
        value:      normalizedEmail,
        normalizedValue: normalizedEmail,
        isPrimary:  true,
        verifiedAt: new Date(),
      },
    });
 
    // INSERT ExternalAccount
    await tx.externalAccount.create({
      data: {
        userId:             user.id,
        providerType:       "OAUTH",
        provider:           "google",
        providerAccountId:  input.googleSub,
        providerEmail:      normalizedEmail,
        providerDisplayName: input.displayName ?? null,
        providerAvatarUrl:  input.avatarUrl    ?? null,
        idTokenEncrypted:      input.idToken      ?? null,
        accessTokenEncrypted:  input.accessToken  ?? null,
        refreshTokenEncrypted: input.refreshToken ?? null,
        scope:              input.scope        ?? null,
        expiresAt:          input.expiresAt    ?? null,
        linkedAt:           new Date(),
        lastUsedAt:         new Date(),
      },
    });
 
    // READ Role(member)
    const memberRole = await tx.role.findUnique({ where: { name: "member" } });
    if (!memberRole) {
      throw new Error("Role 'member' not found. Run: npx prisma db seed");
    }
 
    // INSERT UserRole(member)
    await tx.userRole.create({
      data: {
        userId:     user.id,
        roleId:     memberRole.id,
        assignedById: null,
      },
    });
 
    // INSERT Session
    const session = await createSession(tx, {
      userId:      user.id,
      ip:          input.ip,
      userAgent:   input.userAgent,
      deviceLabel: input.deviceLabel,
    });
 
    // INSERT AuditLog USER_CREATED
    await tx.auditLog.create({
      data: {
        category:     "USER",
        action:       "USER_CREATED",
        actorId:      null,
        targetUserId: user.id,
        ipHash,
        userAgent:    input.userAgent ?? null,
        meta: {
          registrationMethod: "google",
          email:              normalizedEmail,
          role:               "member",
        },
      },
    });
 
    // INSERT AuditLog LOGIN_SUCCESS
    await tx.auditLog.create({
      data: {
        category:     "AUTH",
        action:       "LOGIN_SUCCESS",
        actorId:      user.id,
        targetUserId: user.id,
        ipHash,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "google",
          provider:   "google",
          sessionId:  session.id,
          ipHash,
        },
      },
    });
 
    return {
      sessionToken: session.sessionToken,
      userId:       user.id,
      expiresAt:    session.expiresAt,
    };
  });
}
 
async function handleBranchC(
  prisma: PrismaClient,
  userId: string,
  normalizedEmail: string,
  input: GoogleAuthInput
): Promise<SessionResult> {
  const ipHash = hashAuditIp(input.ip);
  return await prisma.$transaction(async (tx) => {
    // INSERT ExternalAccount — link Google to existing User
    await tx.externalAccount.create({
      data: {
        userId,
        providerType:        "OAUTH",
        provider:            "google",
        providerAccountId:   input.googleSub,
        providerEmail:       normalizedEmail,
        providerDisplayName: input.displayName ?? null,
        providerAvatarUrl:   input.avatarUrl   ?? null,
        idTokenEncrypted:      input.idToken      ?? null,
        accessTokenEncrypted:  input.accessToken  ?? null,
        refreshTokenEncrypted: input.refreshToken ?? null,
        scope:               input.scope        ?? null,
        expiresAt:           input.expiresAt    ?? null,
        linkedAt:            new Date(),
        lastUsedAt:          new Date(),
      },
    });
 
    // UPDATE UserIdentifier.verifiedAt if null — Google confirms email ownership
    const existingIdentifier = await tx.userIdentifier.findUnique({
      where: {
        type_normalizedValue: {
          type: "EMAIL",
          normalizedValue: normalizedEmail,
        },
      },
      select: { verifiedAt: true },
    });
 
    if (!existingIdentifier?.verifiedAt) {
      await tx.userIdentifier.update({
        where: {
          type_normalizedValue: {
            type: "EMAIL",
            normalizedValue: normalizedEmail,
          },
        },
        data:  { verifiedAt: new Date() },
      });
    }
 
    // INSERT Session
    const session = await createSession(tx, {
      userId,
      ip:          input.ip,
      userAgent:   input.userAgent,
      deviceLabel: input.deviceLabel,
    });
 
    // UPDATE User login metadata
    await tx.user.update({
      where: { id: userId },
      data: {
        lastLoginAt:   new Date(),
        lastLoginIp:   input.ip        ?? null,
        lastUserAgent: input.userAgent ?? null,
      },
    });
 
    // INSERT AuditLog LOGIN_SUCCESS
    await tx.auditLog.create({
      data: {
        category:     "AUTH",
        action:       "LOGIN_SUCCESS",
        actorId:      userId,
        targetUserId: userId,
        ipHash,
        userAgent:    input.userAgent ?? null,
        meta: {
          authMethod: "google",
          provider:   "google",
          sessionId:  session.id,
          ipHash,
        },
      },
    });
 
    return {
      sessionToken: session.sessionToken,
      userId,
      expiresAt:    session.expiresAt,
    };
  });
}
