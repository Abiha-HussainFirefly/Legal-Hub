import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/normalize";
import { hashPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/token";
import { sharedAuthLookup, isAdmin } from "@/lib/auth/auth-lookup";
import { AuthError, ManualRegisterInput, RegisterResult } from "../types";

/**
 * Manual Registration Flow — Public Users
 *
 * Rules (from guide):
 *  - Public users always get the 'member' role on registration
 *  - Admin accounts are never created through public signup
 *  - If email belongs to an existing admin → block
 *  - If email belongs to an existing manual/hybrid account → block duplicate signup
 *  - If email belongs to an existing Google-only account → block with Google-auth message
 *  - Do NOT create a second User record
 *
 * Flow (matches diagram exactly):
 *  1. Normalize email
 *  2. READ UserIdentifier EMAIL
 *  3a. If found → READ User + Role + Credential + ExternalAccount
 *      - Role admin? → STOP (reject public signup for admin email)
 *      - Credential exists? → STOP (account already exists)
 *      - No credential + Google account exists? → STOP (Google-auth-only message)
 *      - No credential + No Google account? → STOP (inconsistent identity state)
 *  3b. If not found → TX BEGIN
 *  4.  INSERT User
 *  5.  INSERT UserIdentifier (verifiedAt=null — not verified until email token consumed)
 *  6.  INSERT Credential
 *  7.  READ Role(member)
 *  8.  INSERT UserRole(member)
 *  9.  INSERT VerificationToken (purpose=email_verify)
 * 10.  INSERT AuditLog USER_CREATED
 * 11.  TX COMMIT
 * 12.  [Caller] Send verification email
 * 13.  Return signup success: verify email
 */
export async function manualRegister(
  prisma: PrismaClient,
  input: ManualRegisterInput
): Promise<RegisterResult & { verificationToken: string }> {
  const normalizedEmail = normalizeEmail(input.email);

  // Step 2 — READ UserIdentifier EMAIL
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

    // Has a credential → manual or hybrid account already exists
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

    // No credential, no Google account → inconsistent state (should not happen in clean DB)
    throw new AuthError(
      "INCONSISTENT_IDENTITY",
      "Identifier exists but no credential or external account found",
      "An error occurred. Please contact support."
    );
  }

  // Hash password before entering transaction
  // Their hashPassword returns { hash, algo } — destructure both
  const { hash: passwordHash, algo: passwordAlgo } = await hashPassword(input.password);
  const rawToken = generateToken(32);
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Steps 4–11 — single atomic transaction
  const { userId } = await prisma.$transaction(async (tx) => {
    // Step 4 — INSERT User
    const user = await tx.user.create({
      data: {
        userType: "EXTERNAL",
        status: "ACTIVE",
        displayName: input.displayName,
        locale: input.locale ?? "en",
        timeZone: input.timeZone ?? null,
      },
    });

    // Step 5 — INSERT UserIdentifier (verifiedAt=null — set only on token consumption)
    await tx.userIdentifier.create({
      data: {
        userId: user.id,
        type: "EMAIL",
        value: normalizedEmail,
        isPrimary: true,
        verifiedAt: null,
      },
    });

    // Step 6 — INSERT Credential
    await tx.credential.create({
      data: {
        userId: user.id,
        passwordHash,
        passwordAlgo,           // 'bcrypt' — comes from hashPassword() return value
        passwordSetAt: new Date(),
        mustRotate: false,
      },
    });

    // Step 7 — READ Role(member)
    const memberRole = await tx.role.findUnique({ where: { name: "member" } });
    if (!memberRole) {
      throw new Error(
        "Role 'member' not found. Run your seed script to create roles first."
      );
    }

    // Step 8 — INSERT UserRole(member)
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: memberRole.id,
        assignedBy: null, // self-registration, no actor
      },
    });

    // Step 9 — INSERT VerificationToken (purpose=email_verify, one-time-use)
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

    // Step 10 — INSERT AuditLog USER_CREATED
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

  // Step 12 — Caller is responsible for sending the verification email using `verificationToken`
  // Step 13 — Return signup success
  return {
    userId,
    verificationToken: rawToken,
    message: "Account created. Please verify your email.",
  };
}
