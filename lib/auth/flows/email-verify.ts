import { PrismaClient } from "@prisma/client";
import { AuthError, EmailVerifyInput, EmailVerifyResult } from "../types";


export async function verifyEmail(
  prisma: PrismaClient,
  input: EmailVerifyInput
): Promise<EmailVerifyResult> {
  // READ VerificationToken by token
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { tokenHash: input.token },
  });

  // Token found?
  if (!verificationToken) {
    throw new AuthError(
      "INVALID_TOKEN",
      "Verification token not found",
      "This verification link is invalid."
    );
  }

  // purpose=email_verify?
  if (verificationToken.purpose !== "email_verify") {
    throw new AuthError(
      "INVALID_TOKEN_PURPOSE",
      `Token purpose '${verificationToken.purpose}' is not 'email_verify'`,
      "This verification link is invalid."
    );
  }

  const now = new Date();

  // consumedAt IS NULL AND expiresAt > now?
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

  
  await prisma.$transaction(async (tx) => {
    // READ UserIdentifier by userId + identifierValue
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

    //  UPDATE UserIdentifier.verifiedAt = now()
    await tx.userIdentifier.update({
      where: { id: userIdentifier.id },
      data: { verifiedAt: now },
    });

    // UPDATE VerificationToken.consumedAt = now()
    await tx.verificationToken.update({
      where: { id: verificationToken.id },
      data: { consumedAt: now },
    });

    // INSERT AuditLog EMAIL_VERIFIED
    await tx.auditLog.create({
      data: {
        category: "AUTH",
        action: "EMAIL_VERIFIED",
        actorId: null,
        targetUserId: userId,
        ipHash: null,
        userAgent: null,
        meta: {
          identifierType: "EMAIL",
          identifierValue,
        },
      },
    });
  });

  return { userId };
}
