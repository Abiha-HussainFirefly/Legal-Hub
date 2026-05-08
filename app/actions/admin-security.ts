"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { AuditCategory, ContentTargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdminActor(permissionKey: string) {
  const session = await auth();
  const actorId = session?.user?.id ?? null;
  const actorRoles = ((session?.user as { roles?: string[] } | undefined)?.roles ?? []).map((role) => role.toLowerCase());
  const actorPermissions = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];

  if (!actorId || !canAccessAdminPermission(actorRoles, actorPermissions, permissionKey)) {
    throw new Error("Unauthorized");
  }

  return { actorId };
}

function revalidateSecuritySurfaces(userId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath(`/user/${userId}`);
  revalidatePath(`/user/${userId}?tab=security`);
}

export async function adminSessionRevokeAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.SECURITY_MANAGE);
  const sessionId = normalizeText(formData.get("sessionId"));
  const reason = normalizeText(formData.get("reason"));

  if (!sessionId) {
    throw new Error("Missing session input");
  }

  if (!reason) {
    throw new Error("A reason is required for session revocation");
  }

  const sessionRow = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (!sessionRow) {
    throw new Error("Session not found");
  }

  if (sessionRow.revokedAt) {
    throw new Error("This session is already revoked");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: sessionRow.id },
      data: {
        revokedAt: now,
        revokeReason: `ADMIN_SECURITY_REVOKE:${reason}`,
      },
    });

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SECURITY,
        action: "ADMIN_SESSION_REVOKED",
        actorId,
        targetUserId: sessionRow.userId,
        targetType: ContentTargetType.USER,
        targetId: sessionRow.userId,
        meta: {
          sessionId: sessionRow.id,
          previousExpiresAt: sessionRow.expiresAt.toISOString(),
          reason,
        },
      },
    });
  });

  revalidateSecuritySurfaces(sessionRow.userId);
}
