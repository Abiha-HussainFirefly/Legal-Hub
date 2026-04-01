import { PrismaClient } from "@prisma/client";

export interface AuthLookupResult {
  userIdentifier: {
    id: string;
    userId: string;
    type: string;
    value: string;
    isPrimary: boolean;
    verifiedAt: Date | null;
  } | null;
  user: {
    id: string;
    userType: string;
    status: string;
    displayName: string | null;
    deletedAt: Date | null;
    lastLoginAt: Date | null;
  } | null;
  roles: string[];          // role names e.g. ["admin"] or ["member"]
  credential: {
    id: string;
    passwordHash: string;
    passwordAlgo: string | null;
    mustRotate: boolean;
  } | null;
  googleAccount: {
    id: string;
    providerAccountId: string;
    providerEmail: string | null;
  } | null;
}

/**
 * Shared auth lookup rule used by EVERY flow.
 *
 * Flow (matches diagram exactly):
 *   1. Normalize email (caller must pass already-normalized value)
 *   2. READ UserIdentifier where type=EMAIL and value=normalizedEmail
 *   3. If not found → return nulls (no account)
 *   4. READ User by userId
 *   5. READ UserRole + Role
 *   6. READ Credential by userId
 *   7. READ ExternalAccount(provider='google') by userId
 *   8. Check User.status and deletedAt  ← caller interprets this
 *   9. Continue into flow-specific decision ← caller handles this
 */
export async function sharedAuthLookup(
  prisma: PrismaClient,
  normalizedEmail: string
): Promise<AuthLookupResult> {
  // Step 2 — READ UserIdentifier
  const userIdentifier = await prisma.userIdentifier.findUnique({
    where: { type_value: { type: "EMAIL", value: normalizedEmail } },
    select: {
      id: true,
      userId: true,
      type: true,
      value: true,
      isPrimary: true,
      verifiedAt: true,
    },
  });

  if (!userIdentifier) {
    // No account exists for this email
    return {
      userIdentifier: null,
      user: null,
      roles: [],
      credential: null,
      googleAccount: null,
    };
  }

  // Step 4 — READ User by userId
  const user = await prisma.user.findUnique({
    where: { id: userIdentifier.userId },
    select: {
      id: true,
      userType: true,
      status: true,
      displayName: true,
      deletedAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    return {
      userIdentifier,
      user: null,
      roles: [],
      credential: null,
      googleAccount: null,
    };
  }

  // Steps 5, 6, 7 — parallel reads
  const [userRoles, credential, googleAccount] = await Promise.all([
    // Step 5 — READ UserRole + Role
    prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: { select: { name: true } } },
    }),
    // Step 6 — READ Credential by userId
    prisma.credential.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        passwordHash: true,
        passwordAlgo: true,
        mustRotate: true,
      },
    }),
    // Step 7 — READ ExternalAccount(provider='google')
    prisma.externalAccount.findFirst({
      where: { userId: user.id, provider: "google" },
      select: {
        id: true,
        providerAccountId: true,
        providerEmail: true,
      },
    }),
  ]);

  return {
    userIdentifier,
    user,
    roles: userRoles.map((ur) => ur.role.name),
    credential,
    googleAccount,
  };
}

/** Helper — true when the user is ACTIVE and not soft-deleted */
export function isUserActive(
  user: AuthLookupResult["user"]
): boolean {
  return (
    user !== null &&
    user.status === "ACTIVE" &&
    user.deletedAt === null
  );
}

/** Helper — true when the user has the admin role */
export function isAdmin(roles: string[]): boolean {
  return roles.includes("admin");
}
