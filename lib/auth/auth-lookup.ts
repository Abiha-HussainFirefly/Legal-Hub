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


export async function sharedAuthLookup(
  prisma: PrismaClient,
  normalizedEmail: string
): Promise<AuthLookupResult> {
  
  const userIdentifier = await prisma.userIdentifier.findUnique({
    where: {
      type_normalizedValue: {
        type: "EMAIL",
        normalizedValue: normalizedEmail,
      },
    },
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
   
    return {
      userIdentifier: null,
      user: null,
      roles: [],
      credential: null,
      googleAccount: null,
    };
  }

  // READ User by userId
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

  
  const [userRoles, credential, googleAccount] = await Promise.all([
    // READ UserRole + Role
    prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: { select: { name: true } } },
    }),
    // READ Credential by userId
    prisma.credential.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        passwordHash: true,
        passwordAlgo: true,
        mustRotate: true,
      },
    }),
    // READ ExternalAccount(provider='google')
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


export function isUserActive(
  user: AuthLookupResult["user"]
): boolean {
  return (
    user !== null &&
    user.status === "ACTIVE" &&
    user.deletedAt === null
  );
}


export function isAdmin(roles: string[]): boolean {
  return roles.includes("admin");
}
