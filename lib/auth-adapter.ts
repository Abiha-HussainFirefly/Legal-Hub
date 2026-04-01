// lib/auth-adapter.ts
import { prisma } from "@/lib/prisma";
import type {
  Adapter,
  AdapterUser,
  AdapterSession,
} from "next-auth/adapters";

// ─────────────────────────────────────────────────────────────
// Helpers: map your DB User shape → NextAuth AdapterUser shape
// Your schema stores email in UserIdentifier, not on User itself
// ─────────────────────────────────────────────────────────────
function toAdapterUser(
  user: any,
  overrideEmail?: string | null
): AdapterUser {
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

function toAdapterSession(session: any): AdapterSession {
  return {
    sessionToken: session.sessionToken,
    userId: session.userId,
    expires: session.expiresAt, // your schema: expiresAt → NextAuth: expires
  };
}

// ─────────────────────────────────────────────────────────────
// Adapter
// ─────────────────────────────────────────────────────────────
export function CustomPrismaAdapter(): Adapter {
  return {
    // ── User ────────────────────────────────────────────────

    async createUser(data) {
      const user = await prisma.user.create({
        data: {
          displayName: data.name ?? undefined,
          avatarUrl: data.image ?? undefined,
          identifiers: data.email
            ? {
                create: {
                  type: "EMAIL",
                  value: data.email.toLowerCase(),
                  isPrimary: true,
                  verifiedAt: data.emailVerified ?? undefined,
                },
              }
            : undefined,
        },
        include: { identifiers: true },
      });
      return toAdapterUser(user, data.email);
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { identifiers: true },
      });
      if (!user) return null;
      return toAdapterUser(user);
    },

    async getUserByEmail(email) {
      const identifier = await prisma.userIdentifier.findUnique({
        where: {
          type_value: { type: "EMAIL", value: email.toLowerCase() },
        },
        include: { user: { include: { identifiers: true } } },
      });
      if (!identifier) return null;
      return toAdapterUser(identifier.user, email);
    },

    async getUserByAccount({ provider, providerAccountId }) {
      // Your model is ExternalAccount, not Account
      const account = await prisma.externalAccount.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
        include: { user: { include: { identifiers: true } } },
      });
      if (!account) return null;
      return toAdapterUser(account.user);
    },

    async updateUser({ id, ...data }) {
      // Update the User row
      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { displayName: data.name }),
          ...(data.image !== undefined && { avatarUrl: data.image }),
        },
        include: { identifiers: true },
      });

      // Sync emailVerified into UserIdentifier if provided
      if (data.emailVerified !== undefined && data.email) {
        await prisma.userIdentifier.updateMany({
          where: {
            userId: id,
            type: "EMAIL",
            value: data.email.toLowerCase(),
          },
          data: { verifiedAt: data.emailVerified },
        });
      }

      return toAdapterUser(user, data.email);
    },

    async deleteUser(id) {
      await prisma.user.delete({ where: { id } });
    },

    // ── Account (ExternalAccount in your schema) ────────────

    async linkAccount(account) {
      await prisma.externalAccount.create({
        data: {
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          providerType: "OAUTH",
          accessToken: account.access_token ?? undefined,
          refreshToken: account.refresh_token ?? undefined,
          idToken: account.id_token ?? undefined,
          tokenType: account.token_type ?? undefined,
          scope: account.scope ?? undefined,
          expiresAt: account.expires_at ?? undefined,
          sessionState: account.session_state != null
            ? String(account.session_state)
            : undefined,
        },
      });
      return account;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.externalAccount.delete({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
      });
    },

    // ── Session ─────────────────────────────────────────────
    // Your schema uses `expiresAt`; NextAuth expects `expires`

    async createSession({ sessionToken, userId, expires }) {
      const session = await prisma.session.create({
        data: {
          sessionToken,
          userId,
          expiresAt: expires, // map expires → expiresAt
        },
      });
      return toAdapterSession(session);
    },

    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: { include: { identifiers: true } } },
      });

      // Treat revoked or expired sessions as non-existent
      if (
        !session ||
        session.revokedAt !== null ||
        session.expiresAt < new Date()
      ) {
        return null;
      }

      // Keep lastSeenAt fresh
      await prisma.session.update({
        where: { sessionToken },
        data: { lastSeenAt: new Date() },
      });

      return {
        session: toAdapterSession(session),
        user: toAdapterUser(session.user),
      };
    },

    async updateSession({ sessionToken, expires, userId }) {
      const session = await prisma.session.update({
        where: { sessionToken },
        data: {
          ...(expires && { expiresAt: expires }),
          lastSeenAt: new Date(),
        },
      });
      return toAdapterSession(session);
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({ where: { sessionToken } }).catch(() => {
        // Silently ignore if already deleted (race condition on logout)
      });
    },

    // ── Verification Token ──────────────────────────────────
    // Your VerificationToken has `purpose` and `identifierValue`
    // instead of NextAuth's `identifier` field

    async createVerificationToken({ identifier, token, expires }) {
      await prisma.verificationToken.create({
        data: {
          token,
          purpose: "email_verify",
          identifierType: "EMAIL",
          identifierValue: identifier,
          expiresAt: expires,
        },
      });
      return { identifier, token, expires };
    },

    async useVerificationToken({ identifier, token }) {
      const vt = await prisma.verificationToken.findFirst({
        where: {
          token,
          identifierValue: identifier,
          purpose: "email_verify",
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!vt) return null;

      // Mark as consumed instead of deleting — keeps your audit trail
      await prisma.verificationToken.update({
        where: { id: vt.id },
        data: { consumedAt: new Date() },
      });

      return { identifier, token, expires: vt.expiresAt };
    },
  };
}
