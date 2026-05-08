"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { AuditCategory, ContentTargetType, NotificationType, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function adminUserLifecycleAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.USERS_MANAGE);

  const userId = normalizeText(formData.get("userId"));
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!userId || !intent) {
    throw new Error("Missing action input");
  }

  if (userId === actorId && intent !== "revoke_sessions") {
    throw new Error("You cannot change your own account status from the admin portal");
  }

  if (intent !== "revoke_sessions" && !reason) {
    throw new Error("A reason is required for this action");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, deletedAt: true },
  });

  if (!target) {
    throw new Error("User not found");
  }

  const now = new Date();
  const path = `/user/${userId}`;

  await prisma.$transaction(async (tx) => {
    if (intent === "suspend") {
      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.SUSPENDED },
      });
      await tx.session.updateMany({
        where: { userId, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: `ADMIN_SUSPEND:${reason}` },
      });
    } else if (intent === "disable") {
      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.DISABLED },
      });
      await tx.session.updateMany({
        where: { userId, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: `ADMIN_DISABLE:${reason}` },
      });
    } else if (intent === "restore") {
      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE, deletedAt: null },
      });
    } else if (intent === "soft_delete") {
      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.DELETED, deletedAt: now },
      });
      await tx.session.updateMany({
        where: { userId, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: `ADMIN_DELETE:${reason}` },
      });
    } else if (intent === "revoke_sessions") {
      await tx.session.updateMany({
        where: { userId, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: reason ? `ADMIN_REVOKE:${reason}` : "ADMIN_REVOKE" },
      });
    } else {
      throw new Error("Unsupported action");
    }

    await tx.auditLog.create({
      data: {
        category: intent === "revoke_sessions" ? AuditCategory.SECURITY : AuditCategory.USER,
        action: `ADMIN_${intent.toUpperCase()}`,
        actorId,
        targetUserId: userId,
        targetType: ContentTargetType.USER,
        targetId: userId,
        meta: {
          reason: reason || null,
          previousStatus: target.status,
          previousDeletedAt: target.deletedAt?.toISOString() ?? null,
        },
      },
    });
  });

  revalidatePath("/user");
  revalidatePath(path);
}

async function requireAdminActor(permissionKey: string) {
  const session = await auth();
  const actorId = session?.user?.id ?? null;
  const actorRoles = ((session?.user as { roles?: string[] } | undefined)?.roles ?? []).map((role) => role.toLowerCase());
  const actorPermissions = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];

  if (!actorId || !canAccessAdminPermission(actorRoles, actorPermissions, permissionKey)) {
    throw new Error("Unauthorized");
  }

  return { actorId, actorRoles };
}

function parseSelectedUserIds(formData: FormData) {
  const selectedRows = formData.getAll("selectedUserIds");

  return selectedRows
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function revalidateAdminUserSurfaces(userIds: string[]) {
  revalidatePath("/user");
  for (const userId of userIds) {
    revalidatePath(`/user/${userId}`);
  }
}

export async function adminBulkUserAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.USERS_MANAGE);
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));
  const userIds = parseSelectedUserIds(formData);

  if (!intent) throw new Error("Bulk action is required");
  if (!userIds.length) throw new Error("Select at least one user");

  const lifecycleIntents = new Set(["suspend", "disable", "restore", "soft_delete", "revoke_sessions"]);

  if (lifecycleIntents.has(intent) && intent !== "revoke_sessions" && !reason) {
    throw new Error("A reason is required for this bulk action");
  }

  if (!lifecycleIntents.has(intent)) {
    throw new Error("Unsupported bulk action");
  }

  if (intent !== "revoke_sessions" && userIds.includes(actorId)) {
    throw new Error("Bulk status actions cannot target your own admin account");
  }

  const now = new Date();
  const targets = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, status: true, deletedAt: true },
  });

  if (!targets.length) {
    throw new Error("No users found for the selected bulk action");
  }

  await prisma.$transaction(async (tx) => {
    if (intent === "suspend") {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: UserStatus.SUSPENDED },
      });
      await tx.session.updateMany({
        where: { userId: { in: userIds }, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: `ADMIN_BULK_SUSPEND:${reason}` },
      });
    } else if (intent === "disable") {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: UserStatus.DISABLED },
      });
      await tx.session.updateMany({
        where: { userId: { in: userIds }, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: `ADMIN_BULK_DISABLE:${reason}` },
      });
    } else if (intent === "restore") {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: UserStatus.ACTIVE, deletedAt: null },
      });
    } else if (intent === "soft_delete") {
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { status: UserStatus.DELETED, deletedAt: now },
      });
      await tx.session.updateMany({
        where: { userId: { in: userIds }, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: `ADMIN_BULK_DELETE:${reason}` },
      });
    } else if (intent === "revoke_sessions") {
      await tx.session.updateMany({
        where: { userId: { in: userIds }, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now, revokeReason: reason ? `ADMIN_BULK_REVOKE:${reason}` : "ADMIN_BULK_REVOKE" },
      });
    }

    await tx.auditLog.createMany({
      data: targets.map((target) => ({
        category: intent === "revoke_sessions" ? AuditCategory.SECURITY : AuditCategory.USER,
        action: `ADMIN_BULK_${intent.toUpperCase()}`,
        actorId,
        targetUserId: target.id,
        targetType: ContentTargetType.USER,
        targetId: target.id,
        meta: {
          reason: reason || null,
          previousStatus: target.status,
          previousDeletedAt: target.deletedAt?.toISOString() ?? null,
        },
      })),
    });
  });

  revalidateAdminUserSurfaces(userIds);
}

export async function adminBulkNotificationAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.NOTIFICATIONS_MANAGE);
  const title = normalizeText(formData.get("title"));
  const message = normalizeText(formData.get("message"));
  const reason = normalizeText(formData.get("reason"));
  const userIds = parseSelectedUserIds(formData);

  if (!userIds.length) throw new Error("Select at least one user");
  if (!title) throw new Error("Notification title is required");
  if (!reason) throw new Error("Reason is required for notification send");

  await prisma.$transaction(async (tx) => {
    await tx.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        actorId,
        type: NotificationType.SYSTEM,
        title,
        message: message || null,
        data: {
          source: "admin_bulk_notification",
          reason,
        },
      })),
    });

    await tx.auditLog.createMany({
      data: userIds.map((userId) => ({
        category: AuditCategory.SYSTEM,
        action: "ADMIN_BULK_NOTIFICATION_SENT",
        actorId,
        targetUserId: userId,
        targetType: ContentTargetType.USER,
        targetId: userId,
        meta: {
          title,
          message: message || null,
          reason,
        },
      })),
    });
  });

  revalidateAdminUserSurfaces(userIds);
}
