import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import type {
  Adapter,
  AdapterUser,
  AdapterSession,
} from "next-auth/adapters";

// Helper to map DB User to Auth.js User
function toAdapterUser(user: any, overrideEmail?: string | null): AdapterUser {
  const primaryIdentifier =
    user.identifiers?.find(
      (i: any) => i.type === "EMAIL" && i.isPrimary
    ) ?? user.identifiers?.[0];

  const email = overrideEmail ?? primaryIdentifier?.value ?? "";
  const emailVerified = primaryIdentifier?.verifiedAt ?? null;

  return {
    id: user.id,
    email,
    emailVerified,
    name: user.displayName ?? null,
    image: user.avatarUrl ?? null,
  };
}

function toAdapterSession(session: any, rawToken?: string): AdapterSession {
  return {
    sessionToken: rawToken ?? session.sessionTokenHash,
    userId: session.userId,
    expires: session.expiresAt,
  };
}

export function CustomPrismaAdapter(): Adapter {
  return {
    async createUser(data) {
      const emailValue = data.email?.toLowerCase() ?? "";
      const user = await prisma.user.create({
        data: {
          displayName: data.name ?? undefined,
          avatarUrl: data.image ?? undefined,
          identifiers: data.email
            ? {
                create: [
                  {
                    type: "EMAIL",
                    value: emailValue,
                    normalizedValue: emailValue, // ✅ Required by your schema
                    isPrimary: true,
                    verifiedAt: data.emailVerified ?? undefined,
                  },
                ],
              }
            : undefined,
        },
        include: { identifiers: true },
      });

      // Default role assignment
      const memberRole = await prisma.role.findUnique({ where: { name: "member" } });
      if (memberRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: memberRole.id },
        });
      }
      return toAdapterUser(user, data.email);
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { identifiers: true },
      });
      return user ? toAdapterUser(user) : null;
    },

    async getUserByEmail(email) {
      const normalized = email.toLowerCase();
      const identifier = await prisma.userIdentifier.findUnique({
        where: { type_normalizedValue: { type: "EMAIL", normalizedValue: normalized } },
        include: { user: { include: { identifiers: true } } },
      });
      return identifier ? toAdapterUser(identifier.user, email) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.externalAccount.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: { include: { identifiers: true } } },
      });
      return account ? toAdapterUser(account.user) : null;
    },

    async updateUser({ id, ...data }) {
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { displayName: data.name }),
          ...(data.image !== undefined && { avatarUrl: data.image }),
        },
        include: { identifiers: true },
      });

      if (data.emailVerified !== undefined && data.email) {
        await prisma.userIdentifier.updateMany({
          where: { userId: id, type: "EMAIL", normalizedValue: data.email.toLowerCase() },
          data: { verifiedAt: data.emailVerified },
        });
      }
      return toAdapterUser(user, data.email);
    },

    async deleteUser(id) {
      await prisma.user.delete({ where: { id } });
    },

    async linkAccount(account) {
      await prisma.externalAccount.create({
        data: {
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          providerType: "OAUTH",
          accessTokenEncrypted: account.access_token ?? undefined,
          refreshTokenEncrypted: account.refresh_token ?? undefined,
          idTokenEncrypted: account.id_token ?? undefined,
          tokenType: account.token_type ?? undefined,
          scope: account.scope ?? undefined,
          expiresAt: account.expires_at ?? undefined,
          sessionState: account.session_state != null ? String(account.session_state) : undefined,
        },
      });
      return account as any;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.externalAccount.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    async createSession({ sessionToken, userId, expires }) {
      const sessionTokenHash = createHash("sha256").update(sessionToken).digest("hex");
      const session = await prisma.session.create({
        data: {
          sessionTokenHash,
          userId,
          expiresAt: expires,
        },
      });
      return toAdapterSession(session, sessionToken);
    },

    async getSessionAndUser(sessionToken) {
      const sessionTokenHash = createHash("sha256").update(sessionToken).digest("hex");
      const session = await prisma.session.findUnique({
        where: { sessionTokenHash },
        include: { user: { include: { identifiers: true } } },
      });

      if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
        return null;
      }

      return {
        session: toAdapterSession(session, sessionToken),
        user: toAdapterUser(session.user),
      };
    },

    async updateSession({ sessionToken, expires }) {
      const sessionTokenHash = createHash("sha256").update(sessionToken).digest("hex");
      const session = await prisma.session.update({
        where: { sessionTokenHash },
        data: {
          ...(expires && { expiresAt: expires }),
          lastSeenAt: new Date(),
        },
      });
      return toAdapterSession(session, sessionToken);
    },

    async deleteSession(sessionToken) {
      const sessionTokenHash = createHash("sha256").update(sessionToken).digest("hex");
      await prisma.session.delete({ where: { sessionTokenHash } }).catch(() => {});
    },

    // --- VERIFICATION TOKEN (FIXED FIELD NAMES) ---

    async createVerificationToken({ identifier, token, expires }) {
      await prisma.verificationToken.create({
        data: {
          tokenHash: token, // ✅ Matches 'tokenHash' in your schema
          purpose: "email_verify",
          identifierType: "EMAIL",
          identifierValue: identifier,
          expiresAt: expires,
        },
      });
      return { identifier, token, expires };
    },

    async useVerificationToken({ identifier, token }) {
      const vt = await prisma.verificationToken.findUnique({
        where: { tokenHash: token }, // ✅ Matches 'tokenHash' in your schema
      });

      if (!vt || vt.consumedAt || vt.expiresAt < new Date()) return null;

      await prisma.verificationToken.update({
        where: { id: vt.id },
        data: { consumedAt: new Date() },
      });

      return { 
        identifier: vt.identifierValue ?? "", 
        token: vt.tokenHash, 
        expires: vt.expiresAt 
      };
    },
  };
}