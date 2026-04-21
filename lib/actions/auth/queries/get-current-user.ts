import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export interface GetCurrentUserResult {
  authenticated: boolean;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    roles: string[];
    primaryRole: string | null;
  };
}

/**
 * Industry Standard Session Binding.
 * Compares current request metadata with stored session data.
 */
export async function getCurrentUserQuery(
  sessionToken?: string,
  currentIp?: string | null,
  currentUserAgent?: string | null
): Promise<GetCurrentUserResult> {
  if (!sessionToken) return { authenticated: false };

  try {
    // 1. Hash the incoming token to match the database column
    const sessionTokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    // 2. Query using sessionTokenHash instead of sessionToken
    const session = await prisma.session.findUnique({
      where: { sessionTokenHash }, // ✅ Corrected field name
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        userId: true,
        ip: true,
        userAgent: true,
        user: {
          select: {
            status: true,
            deletedAt: true,
            displayName: true,
            roles: {
              include: { role: { select: { name: true } } },
            },
            identifiers: {
              where: { type: "EMAIL", isPrimary: true },
              select: { value: true },
              take: 1,
            },
          },
        },
      },
    });

    const now = new Date();
    
    // 3. Basic Validity Checks
    if (!session || session.expiresAt < now || session.revokedAt || session.user?.status !== "ACTIVE" || session.user?.deletedAt) {
      return { authenticated: false };
    }

    // 4. Strict Session Binding (Anti-Hijacking)
    if (session.userAgent && currentUserAgent && session.userAgent !== currentUserAgent) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), revokeReason: "USER_AGENT_CHANGE" },
      });
      return { authenticated: false };
    }

    const roles = session.user?.roles?.map((r) => r.role.name) ?? [];

    return {
      authenticated: true,
      user: {
        id: session.userId,
        name: session.user?.displayName ?? null,
        email: session.user?.identifiers?.[0]?.value ?? null,
        roles,
        primaryRole: roles[0] ?? null,
      },
    };
  } catch (err) {
    console.error("[GetCurrentUserQuery] Error:", err);
    return { authenticated: false };
  }
}