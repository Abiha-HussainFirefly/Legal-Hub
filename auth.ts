import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { CustomPrismaAdapter } from "@/lib/auth-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,

  adapter: CustomPrismaAdapter(),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },

  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return true;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { roles: { include: { role: true } } },
      });

      if (!dbUser) return true;

      if (dbUser.status === "SUSPENDED")
        return "/adminlogin?error=ACCOUNT_SUSPENDED";
      if (dbUser.status === "DISABLED")
        return "/adminlogin?error=ACCOUNT_DISABLED";
      if (dbUser.status === "DELETED")
        return "/adminlogin?error=ACCOUNT_DELETED";

      const roles = dbUser.roles.map((r) => r.role.name.toUpperCase());

      await prisma.auditLog.create({
        data: {
          action: "LOGIN_SUCCESS",
          actorId: dbUser.id,
          targetUserId: dbUser.id,
          meta: { provider: "google", roles },
        },
      });

      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      });

      return true;
    },

    async redirect({ url, baseUrl }) {
      const destination = url.startsWith("/")
        ? `${baseUrl}${url}`
        : url.startsWith(baseUrl)
        ? url
        : `${baseUrl}/dashboard`;

      const path = destination.replace(baseUrl, "");

      if (
        path.startsWith("/dashboard") ||
        path.startsWith("/discussions") ||
        path.startsWith("/adminlogin") ||
        path.startsWith("/lawyerlogin") ||
        path.startsWith("/lawyerregister")
      ) {
        return destination;
      }

      return `${baseUrl}/dashboard`;
    },

    async session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;

        if (session.user.email) {
          session.user.email = session.user.email.toLowerCase();
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { roles: { include: { role: true } } },
        });

        (session.user as any).roles =
          dbUser?.roles.map((r) => r.role.name.toUpperCase()) ?? [];

        (session.user as any).status = dbUser?.status ?? "ACTIVE";
      }
      return session;
    },
  },

  pages: {
    signIn: "/adminlogin",
    error: "/adminlogin",
  },

  debug: false,
});