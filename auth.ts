import { CustomPrismaAdapter } from "@/lib/auth-adapter";
import { resolveEffectivePermissions } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
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
        const roles = dbUser.roles.filter((assignment) => assignment.role.isActive).map((r) => r.role.name.toLowerCase());

        if (roles.includes("admin") && (account?.provider === "google")) {
          return "/adminlogin?error=ADMIN_SOCIAL_BLOCKED";
        }

        if (!roles.includes("lawyer") && account?.provider === "google") {
          const lawyerRole = await prisma.role.findUnique({
            where: { name: "lawyer" },
            select: { id: true, isActive: true },
          });
          if (lawyerRole?.isActive) {
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
          include: {
            roles: {
              include: {
                role: {
                  select: {
                    name: true,
                    isActive: true,
                    permissions: {
                      include: {
                        permission: {
                          select: {
                            key: true,
                            isActive: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
        const activeRoleAssignments = dbUser?.roles.filter((assignment) => assignment.role.isActive) ?? [];
        const roles = activeRoleAssignments.map((assignment) => assignment.role.name.toUpperCase());
        const assignedPermissionKeys =
          activeRoleAssignments.flatMap((assignment) =>
            assignment.role.permissions
              .filter((binding) => binding.isActive && binding.permission.isActive)
              .map((binding) => binding.permission.key),
          );

        (session.user as any).roles = roles;
        (session.user as any).permissions = resolveEffectivePermissions(roles, assignedPermissionKeys);
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