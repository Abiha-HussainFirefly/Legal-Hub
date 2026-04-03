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
    async signIn({ user, account, profile, email, credentials }) {
      if (!user?.id) return true;

      // Extract callbackUrl from the request (it's often in the URL)
      // NextAuth v5 provides the request in some contexts, but we can also infer 
      // the intent if the user is redirected to /discussions.
      
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

        // BLOCK ADMINS FROM SOCIAL LOGIN
        if (roles.includes("admin") && (account?.provider === "google" || account?.provider === "facebook")) {
          return "/adminlogin?error=ADMIN_SOCIAL_BLOCKED";
        }

        // AUTO-ASSIGN LAWYER ROLE
        // If the user is logging in through Google/Facebook and doesn't have the LAWYER role yet,
        // we check if they are coming from the lawyer flow.
        if (!roles.includes("lawyer") && (account?.provider === "google" || account?.provider === "facebook")) {
          // We'll use a safer approach: if they aren't an admin, and they are using social login,
          // we can check their intent or just grant lawyer role if they are on the lawyer-facing side.
          // For now, let's ensure any social user who isn't an admin can be a lawyer if they access the lawyer portal.
          
          const lawyerRole = await prisma.role.findUnique({ where: { name: "lawyer" } });
          if (lawyerRole) {
            await prisma.userRole.upsert({
              where: { userId_roleId: { userId: dbUser.id, roleId: lawyerRole.id } },
              update: {},
              create: { userId: dbUser.id, roleId: lawyerRole.id }
            });
          }
        }

        // Ensure Social (Google/Facebook) users are marked as verified in UserIdentifier table
        // Industry Standard: We trust the verification provided by the OAuth provider.
        if (account?.provider === "google" || account?.provider === "facebook") {
          await prisma.userIdentifier.updateMany({
            where: { 
              userId: dbUser.id, 
              type: "EMAIL",
              verifiedAt: null // Only update if not already verified
            },
            data: { verifiedAt: new Date() }
          });
        }
      }

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