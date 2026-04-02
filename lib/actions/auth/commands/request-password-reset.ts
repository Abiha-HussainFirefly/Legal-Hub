import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth/token";
import { sendPasswordResetEmail } from "@/lib/auth/email";

export interface RequestPasswordResetInput {
  email: string;
  portal?: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface RequestPasswordResetResult {
  success: boolean;
  message: string;
}

const AuditAction = {
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
} as const;

const GENERIC_RESPONSE: RequestPasswordResetResult = {
  success: true,
  message: "If an account with that email exists, a password reset link has been sent.",
};

/**
 * Industry Standard Command for Requesting a Password Reset.
 * Separates API concerns from Business Logic.
 */
export async function requestPasswordResetCommand(
  input: RequestPasswordResetInput
): Promise<RequestPasswordResetResult> {
  const { email, portal, ip, userAgent } = input;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Find the user by email identifier //
    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_value: {
          type: "EMAIL",
          value: normalizedEmail,
        },
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    // 2. Security Check: If user doesn't exist, log audit and return error //
    if (!identifier) {
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PASSWORD_RESET_REQUESTED,
          actorId: null,
          targetUserId: null,
          ip,
          userAgent,
          meta: {
            status: "FAILED",
            reason: "IDENTIFIER_NOT_FOUND",
            email: normalizedEmail,
          },
        },
      });
      
      return {
        success: false,
        error: "NOT_FOUND",
        message: "This email address is not registered with us.",
        status: 404,
      };
    }

    const { user } = identifier;

    // 3. Authorization Check: Only allow ACTIVE users to reset password //
    if (user.status !== "ACTIVE") {
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PASSWORD_RESET_REQUESTED,
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: {
            status: "FAILED",
            reason: `USER_STATUS_${user.status}`,
            email: normalizedEmail,
          },
        },
      });
      return {
        success: false,
        error: "ACCOUNT_NOT_ACTIVE",
        message: "Your account is not active. Please contact support.",
        status: 403,
      };
    }

    // Optional: Only allow if email is verified //
    if (!identifier.verifiedAt) {
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PASSWORD_RESET_REQUESTED,
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: {
            status: "FAILED",
            reason: "EMAIL_NOT_VERIFIED",
            email: normalizedEmail,
          },
        },
      });
      return {
        success: false,
        error: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before resetting your password.",
        status: 403,
      };
    }

    // 4. Invalidate any existing unused password_reset tokens //
    await prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        purpose: "password_reset",
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    // 5. Generate New Token //
    const rawToken = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        purpose: "password_reset",
        token: rawToken,
        expiresAt,
        identifierType: "EMAIL",
        identifierValue: normalizedEmail,
      },
    });

    // 6. Resolve Portal Context //
    // If not provided, try to infer from user role //
    const resolvedPortal =
      portal ??
      (user.roles.some((ur) => ur.role.name.toLowerCase().includes("admin"))
        ? "admin"
        : "lawyer");

    // 7. Send Reset Email //
    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.displayName ?? normalizedEmail,
      token: rawToken,
      portal: resolvedPortal.toLowerCase(),
    });

    // 8. Log Success Audit //
    await prisma.auditLog.create({
      data: {
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        actorId: user.id,
        targetUserId: user.id,
        ip,
        userAgent,
        meta: {
          status: "SUCCESS",
          email: normalizedEmail,
          expiresAt: expiresAt.toISOString(),
          portal: resolvedPortal,
        },
      },
    });

    return {
      success: true,
      message: "A password reset link has been sent to your email.",
    };
  } catch (error) {
    console.error("[requestPasswordResetCommand] Error:", error);
    // Rethrow to let the API handle 500s, or return a failure result //
    throw error;
  }
}
