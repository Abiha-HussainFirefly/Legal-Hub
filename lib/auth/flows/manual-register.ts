import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/normalize";
import { hashPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/token";
import { sharedAuthLookup, isAdmin } from "@/lib/auth/auth-lookup";
import { AuthError, ManualRegisterInput, RegisterResult } from "../types";


export async function manualRegister(
  prisma: PrismaClient,
  input: ManualRegisterInput
): Promise<RegisterResult & { verificationToken: string }> {
  const normalizedEmail = normalizeEmail(input.email);

  // READ UserIdentifier EMAIL
  const lookup = await sharedAuthLookup(prisma, normalizedEmail);

  if (lookup.userIdentifier !== null) {
    // Email already exists — determine the exact block reason

    // Admin email → public signup always blocked
    if (isAdmin(lookup.roles)) {
      throw new AuthError(
        "ADMIN_EMAIL_CONFLICT",
        "Public signup rejected for admin email",
        "This email cannot be used for public registration."
      );
    }

    if (lookup.credential !== null) {
      throw new AuthError(
        "ACCOUNT_ALREADY_EXISTS",
        "Account already exists with this email",
        "An account with this email already exists. Please log in."
      );
    }

    // No credential but has Google account → Google-only account
    if (lookup.googleAccount !== null) {
      throw new AuthError(
        "GOOGLE_ONLY_ACCOUNT",
        "Email is registered via Google auth only",
        "This account already exists with Google Auth. Please continue with Google Auth."
      );
    }

   
    throw new AuthError(
      "INCONSISTENT_IDENTITY",
      "Identifier exists but no credential or external account found",
      "An error occurred. Please contact support."
    );
  }

  const { hash: passwordHash, algo: passwordAlgo } = await hashPassword(input.password);
  const rawToken = generateToken(32);
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  
  const { userId } = await prisma.$transaction(async (tx) => {
    //  INSERT User
    const user = await tx.user.create({
      data: {
        userType: "EXTERNAL",
        status: "ACTIVE",
        displayName: input.displayName,
        locale: input.locale ?? "en",
        timeZone: input.timeZone ?? null,
      },
    });

    await tx.userIdentifier.create({
      data: {
        userId: user.id,
        type: "EMAIL",
        value: normalizedEmail,
        isPrimary: true,
        verifiedAt: null,
      },
    });

    // INSERT Credential
    await tx.credential.create({
      data: {
        userId: user.id,
        passwordHash,
        passwordAlgo,           
        passwordSetAt: new Date(),
        mustRotate: false,
      },
    });

    // READ Role(member)
    const memberRole = await tx.role.findUnique({ where: { name: "member" } });
    if (!memberRole) {
      throw new Error(
        "Role 'member' not found. Run your seed script to create roles first."
      );
    }

    // INSERT UserRole(member)
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: memberRole.id,
        assignedBy: null, 
      },
    });

    // INSERT VerificationToken (purpose=email_verify, one-time-use)
    await tx.verificationToken.create({
      data: {
        userId: user.id,
        purpose: "email_verify",
        token: rawToken,
        expiresAt: tokenExpiresAt,
        consumedAt: null,
        identifierType: "EMAIL",
        identifierValue: normalizedEmail,
      },
    });

    // INSERT AuditLog USER_CREATED
    await tx.auditLog.create({
      data: {
        action: "USER_CREATED",
        actorId: null,
        targetUserId: user.id,
        meta: {
          registrationMethod: "manual",
          email: normalizedEmail,
          role: "member",
        },
      },
    });

    return { userId: user.id };
  });

 
  return {
    userId,
    verificationToken: rawToken,
    message: "Account created. Please verify your email.",
  };
}
