import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/normalize";
import { hashPassword } from "@/lib/auth/password";
import { AuthError, AdminProvisionInput, AdminProvisionResult } from "../types";

// NOTE: Your hashPassword returns { hash, algo } — not a plain string.
// We destructure both fields and store algo in Credential.passwordAlgo.

/**
 * Admin Account Provisioning Flow
 *
 * Rules (from guide):
 *  - Admin accounts are NEVER created through public signup or Google auth
 *  - Called only from seed script, super-admin panel, or protected backoffice service
 *  - Admin role is assigned via UserRole — NOT via userType
 *  - Email must be unique across the entire system
 *
 * Flow (matches diagram exactly):
 *  1. Normalize email
 *  2. READ UserIdentifier EMAIL → if exists → STOP (email must be unique)
 *  3. TX BEGIN
 *  4. INSERT User (userType=EXTERNAL, status=ACTIVE)
 *  5. INSERT UserIdentifier (isPrimary=true, verifiedAt=now if trusted)
 *  6. INSERT Credential (argon2id hash)
 *  7. READ Role where name='admin'
 *  8. INSERT UserRole (admin)
 *  9. INSERT AuditLog USER_CREATED
 * 10. INSERT AuditLog ROLE_ASSIGNED
 * 11. TX COMMIT
 * 12. Return admin created
 */
export async function provisionAdminAccount(
  prisma: PrismaClient,
  input: AdminProvisionInput
): Promise<AdminProvisionResult> {
  const normalizedEmail = normalizeEmail(input.email);

  // Step 2 — READ UserIdentifier: email must be globally unique
  const existing = await prisma.userIdentifier.findUnique({
    where: { type_value: { type: "EMAIL", value: normalizedEmail } },
  });

  if (existing) {
    throw new AuthError(
      "EMAIL_ALREADY_EXISTS",
      "Admin email already exists",
      "This email is already in use. Admin email must be unique."
    );
  }

  // Their hashPassword returns { hash, algo } — destructure both
  const { hash: passwordHash, algo: passwordAlgo } = await hashPassword(input.password);

  // Step 3–11 — single atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // Step 4 — INSERT User
    // userType=EXTERNAL — admin is a normal User record with a UserRole(admin)
    // Guide: "Do not mark admin using userType"
    const user = await tx.user.create({
      data: {
        userType: "EXTERNAL",
        status: "ACTIVE",
        displayName: input.displayName,
        locale: input.locale ?? "en",
        timeZone: input.timeZone ?? null,
      },
    });

    // Step 5 — INSERT UserIdentifier
    await tx.userIdentifier.create({
      data: {
        userId: user.id,
        type: "EMAIL",
        value: normalizedEmail,
        isPrimary: true,
        // Guide: set verifiedAt=now() if admin email is trusted at provisioning time
        verifiedAt: input.trustEmailAtProvisioning ? new Date() : null,
      },
    });

    // Step 6 — INSERT Credential
    await tx.credential.create({
      data: {
        userId: user.id,
        passwordHash,
        passwordAlgo,           // comes from hashPassword() return value: 'bcrypt'
        passwordSetAt: new Date(),
        mustRotate: false,
      },
    });

    // Step 7 — READ Role where name='admin'
    const adminRole = await tx.role.findUnique({ where: { name: "admin" } });
    if (!adminRole) {
      throw new Error(
        "Role 'admin' not found. Run your seed script to create roles first."
      );
    }

    // Step 8 — INSERT UserRole (admin)
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        assignedAt: new Date(),
        assignedBy: input.actorUserId,
      },
    });

    // Step 9 — INSERT AuditLog USER_CREATED
    await tx.auditLog.create({
      data: {
        action: "USER_CREATED",
        actorId: input.actorUserId,
        targetUserId: user.id,
        meta: {
          registrationMethod: "manual_admin_provision",
          email: normalizedEmail,
          role: "admin",
        },
      },
    });

    // Step 10 — INSERT AuditLog ROLE_ASSIGNED
    await tx.auditLog.create({
      data: {
        action: "ROLE_ASSIGNED",
        actorId: input.actorUserId,
        targetUserId: user.id,
        meta: {
          role: "admin",
          assignedBy: input.actorUserId,
        },
      },
    });

    return { userId: user.id };
  });

  // Step 12 — Return admin created
  return result;
}
