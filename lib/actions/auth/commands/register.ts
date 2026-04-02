import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendVerificationCode } from "@/lib/auth/email";
import { RegisterResult, EmailSchema, PasswordSchema } from "../types";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: EmailSchema,
  password: PasswordSchema,
  barCouncilNo: z.string().min(1, "Bar Council Number is required"),
  jurisdiction: z.string().min(1, "Jurisdiction is required"),
  expertise: z.string().min(1, "Expertise is required"),
  ip: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export async function registerCommand(input: RegisterInput): Promise<RegisterResult> {
  // 1. Zod Validation (Command Integrity)
  const validated = RegisterSchema.safeParse(input);
  if (!validated.success) {
    return { success: false, error: "VALIDATION_ERROR", message: validated.error.issues[0].message, status: 400 };
  }

  const { name, email, password, barCouncilNo, jurisdiction, expertise, ip, userAgent } = validated.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = await prisma.userIdentifier.findUnique({
      where: { type_value: { type: "EMAIL", value: normalizedEmail } },
      include: {
        user: {
          include: {
            credential: true,
            roles: { include: { role: true } },
          },
        },
      },
    });

    // 2. Anti-Enumeration: Return success even if user exists
    if (existing?.user) {
      return {
        success: true,
        message: "Registration successful! Please check your inbox for the verification code.",
        data: { userId: existing.user.id, email: normalizedEmail },
      };
    }

    const { hash, algo } = await hashPassword(password);
    
    // 3. Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Strict 10 minutes

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { userType: "EXTERNAL", status: "ACTIVE", displayName: name.trim(), locale: "en" },
      });

      await tx.userIdentifier.create({
        data: { userId: user.id, type: "EMAIL", value: normalizedEmail, isPrimary: true, verifiedAt: null },
      });

      await tx.credential.create({
        data: { userId: user.id, passwordHash: hash, passwordAlgo: algo },
      });

      const memberRole = await tx.role.findUnique({ where: { name: "member" } });
      if (!memberRole) throw new Error("Role 'member' not found.");

      await tx.userRole.create({
        data: { userId: user.id, roleId: memberRole.id },
      });

      // Verification Token (Purpose: email_verify, Token: 6-digit code)
      await tx.verificationToken.create({
        data: {
          userId: user.id,
          purpose: "email_verify",
          token: code,
          expiresAt,
          identifierType: "EMAIL",
          identifierValue: normalizedEmail,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "USER_CREATED",
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { status: "SUCCESS", email: normalizedEmail, barCouncilNo, jurisdiction, expertise },
        },
      });

      return user;
    });

    // 4. Send 6-digit code
    await sendVerificationCode({ to: normalizedEmail, name: newUser.displayName ?? name, code });

    return {
      success: true,
      message: "Registration successful! Please check your inbox for the verification code.",
      data: { userId: newUser.id, email: normalizedEmail },
    };
  } catch (err) {
    console.error("[RegisterCommand] Error:", err);
    throw err;
  }
}
