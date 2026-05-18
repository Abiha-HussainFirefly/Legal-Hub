"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission, normalizeRoleName } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  AuditCategory,
  LawyerVerificationStatus,
  NotificationType,
  OrganizationMemberRole,
  OrganizationMemberStatus,
  OrganizationType,
  OrganizationVisibility,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function revalidatePlatformSurfaces(extraUserIds: string[] = []) {
  revalidatePath("/organizations");
  revalidatePath("/taxonomy");
  revalidatePath("/gamification");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  for (const userId of extraUserIds) {
    revalidatePath(`/user/${userId}`);
  }
}

export async function adminOrganizationAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.ORGANIZATIONS_MANAGE);
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!intent) throw new Error("Missing organization action");
  if (!reason) throw new Error("A reason is required for organization changes");

  if (intent === "create_org") {
    const name = normalizeText(formData.get("name"));
    const slugInput = normalizeText(formData.get("slug"));
    const description = normalizeText(formData.get("description"));
    const ownerId = normalizeText(formData.get("ownerId"));
    const typeInput = normalizeText(formData.get("type")).toUpperCase();
    const visibilityInput = normalizeText(formData.get("visibility")).toUpperCase();

    if (!name) throw new Error("Organization name is required");

    const slug = slugify(slugInput || name);
    if (!slug) throw new Error("A valid slug is required");

    const type = Object.values(OrganizationType).includes(typeInput as OrganizationType)
      ? (typeInput as OrganizationType)
      : OrganizationType.LAW_FIRM;
    const visibility = Object.values(OrganizationVisibility).includes(visibilityInput as OrganizationVisibility)
      ? (visibilityInput as OrganizationVisibility)
      : OrganizationVisibility.PUBLIC;

    await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          description: description || null,
          ownerId: ownerId || null,
          type,
          visibility,
        },
      });

      if (ownerId) {
        await tx.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: organization.id,
              userId: ownerId,
            },
          },
          update: {
            role: OrganizationMemberRole.OWNER,
            status: OrganizationMemberStatus.ACTIVE,
          },
          create: {
            organizationId: organization.id,
            userId: ownerId,
            role: OrganizationMemberRole.OWNER,
            status: OrganizationMemberStatus.ACTIVE,
            invitedById: actorId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          category: AuditCategory.ORGANIZATION,
          action: "ADMIN_ORGANIZATION_CREATED",
          actorId,
          targetId: organization.id,
          meta: {
            name,
            slug,
            ownerId: ownerId || null,
            type,
            visibility,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces(ownerId ? [ownerId] : []);
    return;
  }

  const organizationId = normalizeText(formData.get("organizationId"));
  if (!organizationId) throw new Error("Organization selection is required");

  if (intent === "update_visibility") {
    const visibilityInput = normalizeText(formData.get("visibility")).toUpperCase();
    const visibility = Object.values(OrganizationVisibility).includes(visibilityInput as OrganizationVisibility)
      ? (visibilityInput as OrganizationVisibility)
      : null;

    if (!visibility) throw new Error("A valid visibility is required");

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { visibility },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.ORGANIZATION,
          action: "ADMIN_ORGANIZATION_VISIBILITY_UPDATED",
          actorId,
          targetId: organizationId,
          meta: {
            visibility,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces();
    return;
  }

  if (intent === "change_owner") {
    const ownerId = normalizeText(formData.get("ownerId"));
    if (!ownerId) throw new Error("New owner user ID is required");

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { ownerId },
      });

      await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId,
            userId: ownerId,
          },
        },
        update: {
          role: OrganizationMemberRole.OWNER,
          status: OrganizationMemberStatus.ACTIVE,
        },
        create: {
          organizationId,
          userId: ownerId,
          role: OrganizationMemberRole.OWNER,
          status: OrganizationMemberStatus.ACTIVE,
          invitedById: actorId,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.ORGANIZATION,
          action: "ADMIN_ORGANIZATION_OWNER_CHANGED",
          actorId,
          targetId: organizationId,
          meta: {
            ownerId,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces([ownerId]);
    return;
  }

  throw new Error("Unsupported organization action");
}

export async function adminOrganizationMemberAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.ORGANIZATIONS_MANAGE);
  const memberId = normalizeText(formData.get("memberId"));
  const statusInput = normalizeText(formData.get("status")).toUpperCase();
  const reason = normalizeText(formData.get("reason"));

  if (!memberId || !statusInput) throw new Error("Missing member action input");
  if (!reason) throw new Error("A reason is required for membership changes");

  const status = Object.values(OrganizationMemberStatus).includes(statusInput as OrganizationMemberStatus)
    ? (statusInput as OrganizationMemberStatus)
    : null;

  if (!status) throw new Error("Invalid membership status");

  const membership = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      userId: true,
      organizationId: true,
      role: true,
    },
  });

  if (!membership) throw new Error("Organization membership not found");

  await prisma.$transaction(async (tx) => {
    await tx.organizationMember.update({
      where: { id: memberId },
      data: { status },
    });

    await tx.auditLog.create({
      data: {
        category: AuditCategory.ORGANIZATION,
        action: "ADMIN_ORGANIZATION_MEMBER_STATUS_UPDATED",
        actorId,
        targetUserId: membership.userId,
        targetId: membership.organizationId,
        meta: {
          memberId,
          role: membership.role,
          status,
          reason,
        },
      },
    });
  });

  revalidatePlatformSurfaces([membership.userId]);
}

export async function adminReferenceDataAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.TAXONOMY_MANAGE);
  const entity = normalizeText(formData.get("entity")).toLowerCase();
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!entity || !intent) throw new Error("Missing reference data input");
  if (!reason) throw new Error("A reason is required for reference-data changes");

  const createCommon = {
    name: normalizeText(formData.get("name")),
    slug: slugify(normalizeText(formData.get("slug")) || normalizeText(formData.get("name"))),
  };

  if (intent === "create") {
    if (!createCommon.name || !createCommon.slug) throw new Error("Name and slug are required");

    // ✅ Validate regionId exists before transaction (courts only)
    if (entity === "court") {
      const regionId = normalizeText(formData.get("regionId"));
      if (regionId) {
        const regionExists = await prisma.region.findUnique({
          where: { id: regionId },
          select: { id: true },
        });
        if (!regionExists) {
          throw new Error(
            `The selected region does not exist. Please create the region first, then add the court.`
          );
        }
      }
    }

    // ✅ Guard against duplicate slugs before entering the transaction
    const slugExists = await (async () => {
      if (entity === "category") return prisma.category.findUnique({ where: { slug: createCommon.slug } });
      if (entity === "tag")      return prisma.tag.findUnique({ where: { slug: createCommon.slug } });
      if (entity === "region")   return prisma.region.findUnique({ where: { slug: createCommon.slug } });
      if (entity === "court")    return prisma.court.findUnique({ where: { slug: createCommon.slug } });
      return null;
    })();

    if (slugExists) {
      throw new Error(
        `A ${entity} with the slug "${createCommon.slug}" already exists. Choose a different name or slug.`
      );
    }

    await prisma.$transaction(async (tx) => {
      let targetId = "";

      if (entity === "category") {
        targetId = (
          await tx.category.create({
            data: {
              name: createCommon.name,
              slug: createCommon.slug,
              scope: (normalizeText(formData.get("scope")).toUpperCase() as "DISCUSSION" | "CASE" | "BOTH") || "BOTH",
            },
          })
        ).id;
      } else if (entity === "tag") {
        targetId = (
          await tx.tag.create({
            data: {
              name: createCommon.name,
              slug: createCommon.slug,
              type: (normalizeText(formData.get("tagType")).toUpperCase() as any) || "TOPIC",
            },
          })
        ).id;
      } else if (entity === "region") {
        targetId = (
          await tx.region.create({
            data: {
              name: createCommon.name,
              slug: createCommon.slug,
              type: (normalizeText(formData.get("regionType")).toUpperCase() as any) || "STATE",
              countryCode: normalizeText(formData.get("countryCode")).toUpperCase() || "PK",
            },
          })
        ).id;
      } else if (entity === "court") {
        targetId = (
          await tx.court.create({
            data: {
              name: createCommon.name,
              slug: createCommon.slug,
              level: (normalizeText(formData.get("courtLevel")).toUpperCase() as any) || "OTHER",
              regionId: normalizeText(formData.get("regionId")) || null,
              websiteUrl: normalizeText(formData.get("websiteUrl")) || null,
            },
          })
        ).id;
      } else {
        throw new Error("Unsupported reference entity");
      }

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SYSTEM,
          action: "ADMIN_REFERENCE_CREATED",
          actorId,
          targetId,
          meta: {
            entity,
            name: createCommon.name,
            slug: createCommon.slug,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces();
    return;
  }

  if (intent !== "toggle_active") {
    throw new Error("Unsupported reference action");
  }

  const recordId = normalizeText(formData.get("recordId"));
  const nextActive = normalizeText(formData.get("nextActive")) === "true";
  if (!recordId) throw new Error("Reference record is required");

  await prisma.$transaction(async (tx) => {
    if (entity === "category") {
      await tx.category.update({ where: { id: recordId }, data: { isActive: nextActive } });
    } else if (entity === "tag") {
      await tx.tag.update({ where: { id: recordId }, data: { isActive: nextActive } });
    } else if (entity === "region") {
      await tx.region.update({ where: { id: recordId }, data: { isActive: nextActive } });
    } else if (entity === "court") {
      await tx.court.update({ where: { id: recordId }, data: { isActive: nextActive } });
    } else {
      throw new Error("Unsupported reference entity");
    }

    await tx.auditLog.create({
      data: {
        category: AuditCategory.SYSTEM,
        action: "ADMIN_REFERENCE_TOGGLE_ACTIVE",
        actorId,
        targetId: recordId,
        meta: {
          entity,
          nextActive,
          reason,
        },
      },
    });
  });

  revalidatePlatformSurfaces();
}

export async function adminGamificationAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.GAMIFICATION_MANAGE);
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!intent) throw new Error("Missing gamification action");
  if (!reason) throw new Error("A reason is required for gamification changes");

  if (intent === "create_badge") {
    const code = normalizeRoleName(normalizeText(formData.get("code"))).replace(/\s+/g, "_");
    const name = normalizeText(formData.get("name"));
    const description = normalizeText(formData.get("description"));
    const pointsAwarded = Number.parseInt(normalizeText(formData.get("pointsAwarded")) || "0", 10);

    if (!code || !name) throw new Error("Badge code and name are required");

    await prisma.$transaction(async (tx) => {
      const badge = await tx.badge.create({
        data: {
          code,
          name,
          description: description || null,
          pointsAwarded: Number.isFinite(pointsAwarded) ? pointsAwarded : 0,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SYSTEM,
          action: "ADMIN_BADGE_CREATED",
          actorId,
          targetId: badge.id,
          meta: {
            code,
            name,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces();
    return;
  }

  if (intent === "toggle_badge") {
    const badgeId = normalizeText(formData.get("badgeId"));
    const nextActive = normalizeText(formData.get("nextActive")) === "true";
    if (!badgeId) throw new Error("Badge selection is required");

    await prisma.$transaction(async (tx) => {
      await tx.badge.update({
        where: { id: badgeId },
        data: { isActive: nextActive },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SYSTEM,
          action: "ADMIN_BADGE_TOGGLE_ACTIVE",
          actorId,
          targetId: badgeId,
          meta: {
            nextActive,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces();
    return;
  }

  if (intent === "award_badge") {
    const badgeId = normalizeText(formData.get("badgeId"));
    const userId = normalizeText(formData.get("userId"));
    if (!badgeId || !userId) throw new Error("Badge and user are required");

    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      select: { id: true, name: true, pointsAwarded: true },
    });

    if (!badge) throw new Error("Badge not found");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new Error("User not found");

    await prisma.$transaction(async (tx) => {
      await tx.userBadge.create({
        data: {
          userId,
          badgeId,
          awardedById: actorId,
          reason,
        },
      });

      await tx.gamificationEvent.create({
        data: {
          userId,
          eventType: "BADGE_AWARDED",
          pointsDelta: badge.pointsAwarded,
          metadata: { badgeId, badgeName: badge.name, reason },
        },
      });

      await tx.userGamification.upsert({
        where: { userId },
        update: {
          badgesCount: { increment: 1 },
          totalPoints: { increment: badge.pointsAwarded },
          lastContributionAt: new Date(),
        },
        create: {
          userId,
          badgesCount: 1,
          totalPoints: badge.pointsAwarded,
          lastContributionAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId,
          actorId,
          type: NotificationType.BADGE_AWARDED,
          title: "Badge awarded",
          message: `You were awarded the ${badge.name} badge.`,
          data: {
            badgeId,
            reason,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SYSTEM,
          action: "ADMIN_BADGE_AWARDED",
          actorId,
          targetUserId: userId,
          targetId: badgeId,
          meta: {
            badgeId,
            badgeName: badge.name,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces([userId]);
    return;
  }

  if (intent === "manual_adjustment") {
    const userId = normalizeText(formData.get("userId"));
    const pointsDelta = Number.parseInt(normalizeText(formData.get("pointsDelta")) || "0", 10);
    if (!userId || !Number.isFinite(pointsDelta) || pointsDelta === 0) {
      throw new Error("User and non-zero points delta are required");
    }

    await prisma.$transaction(async (tx) => {
      await tx.gamificationEvent.create({
        data: {
          userId,
          eventType: "MANUAL_ADJUSTMENT",
          pointsDelta,
          metadata: { reason, actorId },
        },
      });

      await tx.userGamification.upsert({
        where: { userId },
        update: {
          totalPoints: { increment: pointsDelta },
          lastContributionAt: new Date(),
        },
        create: {
          userId,
          totalPoints: pointsDelta,
          lastContributionAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.SYSTEM,
          action: "ADMIN_GAMIFICATION_MANUAL_ADJUSTMENT",
          actorId,
          targetUserId: userId,
          meta: {
            pointsDelta,
            reason,
          },
        },
      });
    });

    revalidatePlatformSurfaces([userId]);
    return;
  }

  throw new Error("Unsupported gamification action");
}