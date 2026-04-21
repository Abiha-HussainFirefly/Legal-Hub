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
  status?: number;
  error?: string;
}

const AuditAction = {
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
} as const;

/**
 * Industry Standard Command for Requesting a Password Reset.
 */
export async function requestPasswordResetCommand(
  input: RequestPasswordResetInput
): Promise<RequestPasswordResetResult> {
  const { email, portal, ip, userAgent } = input;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    console.log(`[ForgotPassword] Starting request for: ${normalizedEmail}`);

    // 1. Find the user by email identifier //
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
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    // 2. Security Check: If user doesn't exist, return error //
    if (!identifier) {
      console.log(`[ForgotPassword] FAIL: Email not found in database.`);
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PASSWORD_RESET_REQUESTED,
          actorId: null,
          targetUserId: null,
          ip,
          userAgent,
          meta: { status: "FAILED", reason: "IDENTIFIER_NOT_FOUND", email: normalizedEmail },
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
    console.log(`[ForgotPassword] User Found: ${user.id}, Status: ${user.status}, Verified: ${!!identifier.verifiedAt}`);

    // 3. Authorization Check: Only allow ACTIVE users to reset password //
    if (user.status !== "ACTIVE") {
      console.log(`[ForgotPassword] FAIL: User account is ${user.status}`);
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PASSWORD_RESET_REQUESTED,
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { status: "FAILED", reason: `USER_STATUS_${user.status}`, email: normalizedEmail },
        },
      });
      return {
        success: false,
        error: "ACCOUNT_NOT_ACTIVE",
        message: "Your account is not active. Please contact support.",
        status: 403,
      };
    }

    // 4. Verification Check: Only allow if email is verified //
    if (!identifier.verifiedAt) {
      console.log(`[ForgotPassword] FAIL: Email is not verified.`);
      await prisma.auditLog.create({
        data: {
          action: AuditAction.PASSWORD_RESET_REQUESTED,
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { status: "FAILED", reason: "EMAIL_NOT_VERIFIED", email: normalizedEmail },
        },
      });
      return {
        success: false,
        error: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before resetting your password.",
        status: 403,
      };
    }

    // 5. Invalidate any existing unused password_reset tokens //
    console.log(`[ForgotPassword] Invalidating existing tokens...`);
    await prisma.verificationToken.updateMany({
      where: {
        userId: user.id,
        purpose: "password_reset",
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    // 6. Generate New Token //
    const rawToken = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    console.log(`[ForgotPassword] Token generated.`);

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

    // 7. Resolve Portal Context //
    const resolvedPortal =
      portal ??
      (user.roles.some((ur) => ur.role.name.toLowerCase().includes("admin"))
        ? "admin"
        : "lawyer");

    // 8. Send Reset Email //
    console.log(`[ForgotPassword] Triggering email sending to: ${normalizedEmail} (${resolvedPortal})`);
    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.displayName ?? normalizedEmail,
      token: rawToken,
      portal: resolvedPortal.toLowerCase(),
    });

    console.log(`[ForgotPassword] SUCCESS: Email should be sent now.`);

    // 9. Log Success Audit //
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
    console.error("[ForgotPassword] CRITICAL ERROR:", error);
    throw error;
  }
}
