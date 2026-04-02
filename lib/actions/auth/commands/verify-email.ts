import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { AuthResult, EmailSchema } from "../types";
import { z } from "zod";

const VerifyEmailSchema = z.object({
  email: EmailSchema,
  code: z.string().length(6, "Code must be 6 digits"),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export async function verifyEmailCommand(input: VerifyEmailInput): Promise<AuthResult<{ sessionToken: string; expiresAt: Date }>> {
  const validated = VerifyEmailSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: "VALIDATION_ERROR", message: validated.error.issues[0].message, status: 400 };
  }

  const { email: normalizedEmail, code, ip, userAgent } = validated.data;

  try {
    const record = await prisma.verificationToken.findFirst({
      where: {
        token: code,
        purpose: "email_verify",
        identifierValue: normalizedEmail,
      },
    });

    const isInvalid = !record;
    const isExpired = record ? record.expiresAt < new Date() : false;
    const isConsumed = record ? record.consumedAt !== null : false;

    if (isInvalid || isExpired || isConsumed) {
      return {
        success: false,
        error: isExpired ? "CODE_EXPIRED" : isConsumed ? "CODE_USED" : "INVALID_CODE",
        message: isExpired ? "This code has expired. Please request a new one." : isConsumed ? "This code has already been used." : "Invalid verification code.",
        status: isExpired ? 410 : 400,
      };
    }

    const { session } = await prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

      const identifier = await tx.userIdentifier.findUnique({
        where: { type_value: { type: "EMAIL", value: normalizedEmail } },
      });

      if (!identifier) throw new Error("Could not locate a UserIdentifier to verify.");

      await tx.userIdentifier.update({ where: { id: identifier.id }, data: { verifiedAt: new Date() } });

      await tx.auditLog.create({
        data: {
          action: "EMAIL_VERIFIED",
          actorId: record.userId,
          targetUserId: record.userId,
          ip,
          userAgent,
          meta: { status: "SUCCESS", email: normalizedEmail },
        },
      });

      const session = await createSession(tx, { userId: record.userId!, ip, userAgent });
      return { session };
    });

    return {
      success: true,
      message: "Email verified successfully!",
      data: { sessionToken: session.sessionToken, expiresAt: session.expiresAt },
    };
  } catch (err) {
    console.error("[VerifyEmailCommand] Error:", err);
    throw err;
  }
}
