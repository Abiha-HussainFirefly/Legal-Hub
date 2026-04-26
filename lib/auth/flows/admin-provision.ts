import { PrismaClient } from "@prisma/client";
import { normalizeEmail } from "@/lib/auth/normalize";
import { hashPassword } from "@/lib/auth/password";
import { AuthError, AdminProvisionInput, AdminProvisionResult } from "../types";

export async function provisionAdminAccount(
  prisma: PrismaClient,
  input: AdminProvisionInput
): Promise<AdminProvisionResult> {
  const normalizedEmail = normalizeEmail(input.email);

 
  const existing = await prisma.userIdentifier.findUnique({
    where: {
      type_normalizedValue: {
        type: "EMAIL",
        normalizedValue: normalizedEmail,
      },
    },
  });

  if (existing) {
    throw new AuthError(
      "EMAIL_ALREADY_EXISTS",
      "Admin email already exists",
      "This email is already in use. Admin email must be unique."
    );
  }

  const { hash: passwordHash, algo: passwordAlgo } = await hashPassword(input.password);

  
  const result = await prisma.$transaction(async (tx) => {
   
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
        normalizedValue: normalizedEmail,
        isPrimary: true,
        verifiedAt: input.trustEmailAtProvisioning ? new Date() : null,
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

    // READ Role where name='admin'
    const adminRole = await tx.role.findUnique({ where: { name: "admin" } });
    if (!adminRole) {
      throw new Error(
        "Role 'admin' not found. Run your seed script to create roles first."
      );
    }

    // INSERT UserRole (admin)
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        assignedAt: new Date(),
        assignedById: input.actorUserId,
      },
    });

    // INSERT AuditLog USER_CREATED
    await tx.auditLog.create({
      data: {
        category: "USER",
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

    //  INSERT AuditLog ROLE_ASSIGNED
    await tx.auditLog.create({
      data: {
        category: "USER",
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
  
  return result;
}
