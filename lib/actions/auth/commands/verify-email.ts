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

  const { email: emailInput, code, ip, userAgent } = validated.data;
  const normalizedEmail = emailInput.trim().toLowerCase(); // Always normalize for lookups

  try {
    const record = await prisma.verificationToken.findFirst({
      where: {
        tokenHash: code, // Matches your PostgreSQL schema
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
      // 1. Mark token as used
      await tx.verificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } });

      // 2. Find identifier using the same compound index as your Register action
      const identifier = await tx.userIdentifier.findUnique({
        where: { 
          type_normalizedValue: { // Match your specific Prisma schema index
            type: "EMAIL", 
            normalizedValue: normalizedEmail 
          } 
        },
      });

      if (!identifier) throw new Error("Could not locate a UserIdentifier to verify.");

      // 3. Update verification status
      await tx.userIdentifier.update({ where: { id: identifier.id }, data: { verifiedAt: new Date() } });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          category: "USER", // Added to match your schema's required category
          action: "EMAIL_VERIFIED",
          actorId: record.userId!,
          targetUserId: record.userId!,
          ipHash: ip, // Your schema uses ipHash
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