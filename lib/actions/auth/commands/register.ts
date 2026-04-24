import { sendVerificationCode } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { generateUniqueUsername } from "@/lib/services/profile.server";
import { z } from "zod";
import { EmailSchema, PasswordSchema, RegisterResult } from "../types";

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

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerCommand(input: RegisterInput): Promise<RegisterResult> {
  // 1. Zod Validation (Command Integrity)
  const validated = RegisterSchema.safeParse(input);
  if (!validated.success) {
    return { 
      success: false, 
      error: "VALIDATION_ERROR", 
      message: validated.error.issues[0].message, 
      status: 400 
    };
  }

  const { name, email, password, barCouncilNo, jurisdiction, expertise, ip, userAgent } = validated.data;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Check for existing user using the precise compound index from your schema
    const existing = await prisma.userIdentifier.findUnique({
      where: { 
        type_normalizedValue: { 
          type: "EMAIL", 
          normalizedValue: normalizedEmail 
        } 
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

    // 2. Existing account handling
    if (existing?.user) {
      if (existing.verifiedAt) {
        return {
          success: false,
          error: "ACCOUNT_ALREADY_EXISTS",
          message: "An account with this email already exists. Please log in.",
          status: 409,
        };
      }

      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.verificationToken.create({
        data: {
          userId: existing.user.id,
          purpose: "email_verify",
          tokenHash: code,
          expiresAt,
          identifierType: "EMAIL",
          identifierValue: normalizedEmail,
        },
      });

      await sendVerificationCode({
        to: normalizedEmail,
        name: existing.user.displayName ?? name,
        code,
      });

      return {
        success: true,
        message: "Registration successful! Please check your inbox for the verification code.",
        data: { userId: existing.user.id, email: normalizedEmail },
      };
    }

    const { hash, algo } = await hashPassword(password);
    const generatedUsername = await generateUniqueUsername(name);
    
    // 3. Generate 6-digit code for verification
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    // --- TERMINAL LOG FOR DEVELOPMENT ---
    console.log("\n" + "=".repeat(40));
    console.log("🔑 DEBUG: VERIFICATION CODE");
    console.log(`📧 Email: ${normalizedEmail}`);
    console.log(`🔢 Code:  ${code}`);
    console.log("=".repeat(40) + "\n");

    const newUser = await prisma.$transaction(async (tx) => {
      // Create Base User
      const user = await tx.user.create({
        data: { 
          userType: "EXTERNAL", 
          status: "ACTIVE", 
          displayName: name.trim(), 
          locale: "en" 
        },
      });

      // Create Identifier (Satisfying the unique constraint on normalizedValue)
      await tx.userIdentifier.create({
        data: { 
          userId: user.id, 
          type: "EMAIL", 
          value: email.trim(), 
          normalizedValue: normalizedEmail,
          isPrimary: true, 
          verifiedAt: null 
        },
      });

      // Create Credentials
      await tx.credential.create({
        data: { userId: user.id, passwordHash: hash, passwordAlgo: algo },
      });

      // Public signup on this route is currently the lawyer portal,
      // so provision the lawyer role by default.
      const lawyerRole = await tx.role.findUnique({ where: { name: "lawyer" } });
      if (!lawyerRole) throw new Error("Role 'lawyer' not found.");

      await tx.userRole.create({
        data: { userId: user.id, roleId: lawyerRole.id },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          username: generatedUsername,
          isLawyer: true,
          onboardingStep: "profile_setup",
          onboardingChecklist: [
            "Upload a professional headshot",
            "Add a clear professional headline",
            "Write your professional summary",
            "Add practice areas or skills",
          ],
        },
      });

      await tx.userProfileVisibility.create({
        data: {
          userId: user.id,
        },
      });

      await tx.lawyerProfile.create({
        data: {
          userId: user.id,
          verificationStatus: "PENDING",
        },
      });

      // Create Verification Token
      await tx.verificationToken.create({
        data: {
          userId: user.id,
          purpose: "email_verify",
          tokenHash: code, // Changed back to 'token' based on standard schema; update to 'tokenHash' if your schema requires it
          expiresAt,
          identifierType: "EMAIL",
          identifierValue: normalizedEmail,
        },
      });

      // Audit Log: Fully mapped to your specific schema fields
      await tx.auditLog.create({
        data: {
          category: "USER", 
          action: "USER_CREATED",
          actorId: user.id,
          targetUserId: user.id,
          ipHash: ip, 
          userAgent: userAgent,
          meta: { 
            status: "SUCCESS", 
            email: normalizedEmail, 
            barCouncilNo, 
            jurisdiction, 
            expertise,
            role: "lawyer",
          },
        },
      });

      return user;
    });

    // 4. Send the verification code email (will still attempt to send)
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
