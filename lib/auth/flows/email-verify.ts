import { PrismaClient } from "@prisma/client";
import { AuthError, EmailVerifyInput, EmailVerifyResult } from "../types";

/**
 * Email Verification Flow — Manual Signup
 *
 * Rules (from guide):
 *  - Token is one-time-use (consumedAt must be null)
 *  - Token must not be expired (expiresAt > now)
 *  - purpose must be 'email_verify'
 *  - verifiedAt is only set on token consumption — never before
 *
 * Flow (matches diagram exactly):
 *  1. User clicks email verification link → token arrives
 *  2. READ VerificationToken by token
 *  3. Token found?        No  → STOP: invalid token
 *  4. purpose=email_verify?  No  → STOP: invalid token purpose
 *  5. consumedAt IS NULL AND expiresAt > now?
 *                         No  → STOP: expired or already used
 *  6. TX BEGIN
 *  7. READ UserIdentifier by userId + identifierValue
 *  8. UPDATE UserIdentifier.verifiedAt = now()
 *  9. UPDATE VerificationToken.consumedAt = now()
 * 10. INSERT AuditLog EMAIL_VERIFIED
 * 11. TX COMMIT
 * 12. Return email verified
 */
export async function verifyEmail(
  prisma: PrismaClient,
  input: EmailVerifyInput
): Promise<EmailVerifyResult> {
  // Step 2 — READ VerificationToken by token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: input.token },
  });

  // Step 3 — Token found?
  if (!verificationToken) {
    throw new AuthError(
      "INVALID_TOKEN",
      "Verification token not found",
      "This verification link is invalid."
    );
  }

  // Step 4 — purpose=email_verify?
  if (verificationToken.purpose !== "email_verify") {
    throw new AuthError(
      "INVALID_TOKEN_PURPOSE",
      `Token purpose '${verificationToken.purpose}' is not 'email_verify'`,
      "This verification link is invalid."
    );
  }

  const now = new Date();

  // Step 5 — consumedAt IS NULL AND expiresAt > now?
  const isConsumed = verificationToken.consumedAt !== null;
  const isExpired = verificationToken.expiresAt <= now;

  if (isConsumed || isExpired) {
    throw new AuthError(
      "TOKEN_EXPIRED_OR_USED",
      isConsumed ? "Token already consumed" : "Token has expired",
      "This verification link has already been used or has expired. Please request a new one."
    );
  }

  // Must have userId and identifierValue to proceed
  if (!verificationToken.userId || !verificationToken.identifierValue) {
    throw new AuthError(
      "INVALID_TOKEN",
      "Token is missing userId or identifierValue",
      "This verification link is invalid."
    );
  }

  const userId = verificationToken.userId;
  const identifierValue = verificationToken.identifierValue;

  // Steps 6–11 — single atomic transaction
  await prisma.$transaction(async (tx) => {
    // Step 7 — READ UserIdentifier by userId + identifierValue
    const userIdentifier = await tx.userIdentifier.findFirst({
      where: {
        userId,
        type: "EMAIL",
        value: identifierValue,
      },
    });

    if (!userIdentifier) {
      throw new AuthError(
        "INVALID_TOKEN",
        "UserIdentifier not found for token",
        "This verification link is invalid."
      );
    }

    // Step 8 — UPDATE UserIdentifier.verifiedAt = now()
    await tx.userIdentifier.update({
      where: { id: userIdentifier.id },
      data: { verifiedAt: now },
    });

    // Step 9 — UPDATE VerificationToken.consumedAt = now()
    await tx.verificationToken.update({
      where: { id: verificationToken.id },
      data: { consumedAt: now },
    });

    // Step 10 — INSERT AuditLog EMAIL_VERIFIED
    await tx.auditLog.create({
      data: {
        action: "EMAIL_VERIFIED",
        actorId: null,
        targetUserId: userId,
        meta: {
          identifierType: "EMAIL",
          identifierValue,
        },
      },
    });
  });

  // Step 12 — Return email verified
  return { userId };
}
