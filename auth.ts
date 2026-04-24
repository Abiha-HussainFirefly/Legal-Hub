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
  cookies: {
    sessionToken: {
      name: `session_token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id) return true;
      
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { 
          roles: { include: { role: true } },
          identifiers: { where: { type: "EMAIL" } }
        },
      });

      if (dbUser) {
        if (dbUser.status === "SUSPENDED") return "/adminlogin?error=ACCOUNT_SUSPENDED";
        const roles = dbUser.roles.map((r) => r.role.name.toLowerCase());

        if (roles.includes("admin") && (account?.provider === "google")) {
          return "/adminlogin?error=ADMIN_SOCIAL_BLOCKED";
        }

        if (!roles.includes("lawyer") && account?.provider === "google") {
          const lawyerRole = await prisma.role.findUnique({ where: { name: "lawyer" } });
          if (lawyerRole) {
            await prisma.userRole.upsert({
              where: { userId_roleId: { userId: dbUser.id, roleId: lawyerRole.id } },
              update: {},
              create: { userId: dbUser.id, roleId: lawyerRole.id }
            });
          }
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { roles: { include: { role: true } } },
        });
        (session.user as any).roles = dbUser?.roles.map((r) => r.role.name.toUpperCase()) ?? [];
        (session.user as any).status = dbUser?.status ?? "ACTIVE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/adminlogin",
    error: "/adminlogin",
  },
}); 