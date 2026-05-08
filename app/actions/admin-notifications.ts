"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { AuditCategory, ContentTargetType, LawyerVerificationStatus, NotificationType, UserStatus, UserType } from "@prisma/client";
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

function revalidateNotificationSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/reports");
  revalidatePath("/exports");
}

export async function adminSystemNotificationAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.NOTIFICATIONS_MANAGE);
  const title = normalizeText(formData.get("title"));
  const message = normalizeText(formData.get("message"));
  const reason = normalizeText(formData.get("reason"));
  const q = normalizeText(formData.get("q"));
  const role = normalizeText(formData.get("role")).toLowerCase();
  const statusInput = normalizeText(formData.get("status")).toUpperCase();
  const userTypeInput = normalizeText(formData.get("userType")).toUpperCase();
  const verificationInput = normalizeText(formData.get("verification")).toUpperCase();
  const sendToAll = normalizeText(formData.get("sendToAll")) === "yes";

  if (!title) {
    throw new Error("Notification title is required");
  }

  if (!reason) {
    throw new Error("Reason is required for system notifications");
  }

  const status = Object.values(UserStatus).includes(statusInput as UserStatus) ? (statusInput as UserStatus) : null;
  const userType = Object.values(UserType).includes(userTypeInput as UserType) ? (userTypeInput as UserType) : null;
  const verification = Object.values(LawyerVerificationStatus).includes(verificationInput as LawyerVerificationStatus)
    ? (verificationInput as LawyerVerificationStatus)
    : null;

  const hasAudienceFilters = Boolean(q || role || status || userType || verification);

  if (!hasAudienceFilters && !sendToAll) {
    throw new Error("Set at least one audience filter or explicitly choose send to all");
  }

  const where = {
    ...(q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" as const } },
            { identifiers: { some: { value: { contains: q, mode: "insensitive" as const } } } },
            { profile: { is: { username: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
    ...(role
      ? {
          roles: {
            some: {
              role: {
                name: role,
              },
            },
          },
        }
      : {}),
    ...(status ? { status } : {}),
    ...(userType ? { userType } : {}),
    ...(verification
      ? {
          lawyerProfile: {
            is: {
              verificationStatus: verification,
            },
          },
        }
      : {}),
  };

  const recipients = await prisma.user.findMany({
    where,
    select: {
      id: true,
    },
    take: 1001,
  });

  if (!recipients.length) {
    throw new Error("No users match the selected notification audience");
  }

  if (recipients.length > 1000) {
    throw new Error("Audience exceeds 1000 recipients. Refine filters before sending.");
  }

  const recipientIds = recipients.map((user) => user.id);

  await prisma.$transaction(async (tx) => {
    await tx.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        actorId,
        type: NotificationType.SYSTEM,
        title,
        message: message || null,
        data: {
          source: "admin_system_notification_send_center",
          reason,
          audience: {
            q: q || null,
            role: role || null,
            status: status || null,
            userType: userType || null,
            verification: verification || null,
            sendToAll,
          },
        },
      })),
    });

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SYSTEM,
        action: "ADMIN_SYSTEM_NOTIFICATION_SENT",
        actorId,
        targetType: ContentTargetType.USER,
        meta: {
          title,
          message: message || null,
          reason,
          recipientCount: recipientIds.length,
          audience: {
            q: q || null,
            role: role || null,
            status: status || null,
            userType: userType || null,
            verification: verification || null,
            sendToAll,
          },
          recipientSample: recipientIds.slice(0, 20),
        },
      },
    });
  });

  revalidateNotificationSurfaces();
}
