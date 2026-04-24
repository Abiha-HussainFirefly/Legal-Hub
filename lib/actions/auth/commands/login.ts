import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { LoginResult, EmailSchema, PasswordSchema } from "../types";
import { z } from "zod";
import { getRateLimit, incrementRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";

const LoginSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  loginType: z.enum(["ADMIN", "LAWYER", "CLIENT"]).optional(),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export async function loginCommand(input: LoginInput): Promise<LoginResult> {
  const validated = LoginSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: "VALIDATION_ERROR", message: validated.error.issues[0].message, status: 400 };
  }

  const { email, password, loginType, ip = null, userAgent = null } = validated.data;
  const normalizedEmail = email.trim().toLowerCase();
  
  // 1. Check Login Protector (Account Lock Rule)
  // Logic: 5 fails -> 10 minute block
  const failKey = `login_fail_${normalizedEmail}`;
  const blockWindow = 10 * 60 * 1000; // 10 minutes
  
  const currentFails = getRateLimit(failKey);
  if (currentFails.count >= 5) {
    return { 
      success: false, 
      error: "ACCOUNT_LOCKED", 
      message: "Account Locked. Too many failed attempts. Please try again in 10 minutes.", 
      status: 429 
    };
  }

  try {
    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_normalizedValue: {
          type: "EMAIL",
          normalizedValue: normalizedEmail,
        },
      },
      include: {
        user: {
          include: {
            credential: true,
            roles: { include: { role: true } },
          },
        },
      },
    });

    // --- Helper to handle credential failure ---
    const handleFailure = async (reason: string) => {
      await logLoginAudit({ ip, userAgent, email: normalizedEmail, reason });
      incrementRateLimit(failKey, blockWindow); // Record the failure
      return { success: false, error: "LOGIN_FAILED", message: "Invalid email or password.", status: 401 };
    };

    if (!identifier || !identifier.user) return handleFailure("invalid_credentials");

    const { user } = identifier;

    if (!identifier.verifiedAt) {
      return { success: false, error: "EMAIL_NOT_VERIFIED", message: "Please verify your email address.", status: 403 };
    }

    if (user.status !== "ACTIVE" || user.deletedAt) {
      return { success: false, error: "ACCOUNT_INACTIVE", message: "Your account is not active.", status: 403 };
    }

    if (!user.credential) return handleFailure("missing_credential");

    // Check Password
    const passwordValid = await verifyPassword(password, user.credential.passwordHash);
    if (!passwordValid) return handleFailure("invalid_password");

    // --- Success Path ---
    
    // Clear failure counter on successful login
    resetRateLimit(failKey);

    const assignedRoles = user.roles.map((r) => r.role.name.toUpperCase());
    
    // 1. Admin Portal Restriction
    if (loginType === "ADMIN" && !assignedRoles.includes("ADMIN")) {
      return { success: false, error: "UNAUTHORIZED", message: "Admin access required.", status: 403 };
    }

    // 2. Lawyer Portal Restriction
    if (loginType === "LAWYER" && !assignedRoles.includes("LAWYER")) {
      if (assignedRoles.includes("ADMIN")) {
        return { 
          success: false, 
          error: "UNAUTHORIZED", 
          message: "This is an Administrator account. Please use the Admin Portal to login.", 
          status: 403 
        };
      }
      return { success: false, error: "UNAUTHORIZED", message: "Lawyer access required.", status: 403 };
    }

    const userRole = loginType || (assignedRoles.length > 0 ? assignedRoles[0] : "MEMBER");

    const session = await prisma.$transaction(async (tx) => {
      const newSession = await createSession(tx, { userId: user.id, ip, userAgent });
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), lastLoginIp: ip, lastUserAgent: userAgent },
      });
      return newSession;
    });

    return {
      success: true,
      message: "Login successful.",
      data: {
        user: { id: user.id, displayName: user.displayName || normalizedEmail, email: normalizedEmail, role: userRole },
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
      },
    };
  } catch (err) {
    console.error("[LoginCommand] Error:", err);
    throw err;
  }
}

async function logLoginAudit({ userId, ip, userAgent, email, reason }: { userId?: string; ip: string | null; userAgent: string | null; email: string; reason: string }) {
  await prisma.auditLog.create({
    data: {
      category: "AUTH",
      action: "LOGIN_FAILED",
      actorId: userId ?? null,
      targetUserId: userId ?? null,
      ipHash: ip,
      userAgent,
      meta: { reason, email },
    },
  });
}
