import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { AuthResult } from "../types";

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  ip?: string | null;
  userAgent?: string | null;
}

export async function resetPasswordCommand(input: ResetPasswordInput): Promise<AuthResult> {
  const { token, newPassword, ip, userAgent } = input;

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { tokenHash: token },
      include: { user: true },
    });

    const isValid =
      verificationToken &&
      verificationToken.purpose === "password_reset" &&
      !verificationToken.consumedAt &&
      verificationToken.expiresAt > new Date();

    if (!isValid || !verificationToken.user) {
      return { success: false, error: "INVALID_TOKEN", message: "This reset link is invalid or has expired.", status: 400 };
    }

    const { user } = verificationToken;
    const { hash, algo } = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      // Use upsert to handle cases where a user might not have an existing password record (e.g., social login users)
      await tx.credential.upsert({
        where: { userId: user.id },
        update: { 
          passwordHash: hash, 
          passwordAlgo: algo, 
          passwordSetAt: new Date(), 
          mustRotate: false 
        },
        create: {
          userId: user.id,
          passwordHash: hash,
          passwordAlgo: algo,
          passwordSetAt: new Date(),
          mustRotate: false
        }
      });

      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { consumedAt: new Date() },
      });

      // Industry Standard: If they successfully reset their password via email, the email is verified
      await tx.userIdentifier.updateMany({
        where: { userId: user.id, type: "EMAIL", verifiedAt: null },
        data: { verifiedAt: new Date() },
      });

      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: "PASSWORD_RESET" },
      });

      await tx.auditLog.create({
        data: {
          category: "AUTH",
          action: "PASSWORD_RESET_COMPLETED",
          actorId: user.id,
          targetUserId: user.id,
          ipHash: ip,
          userAgent,
          meta: { status: "SUCCESS", email: verificationToken.identifierValue },
        },
      });
    });

    return { success: true, message: "Password reset successfully. You can now log in." };
  } catch (err) {
    console.error("[ResetPasswordCommand] Error:", err);
    throw err;
  }
}
