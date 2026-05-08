"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  AuditCategory,
  ContentTargetType,
  LawyerVerificationStatus,
  ModerationActionType,
  NotificationType,
  RepositoryItemStatus,
} from "@prisma/client";
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

function revalidateCaseSurfaces(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/case-review");
  revalidatePath(`/case-review/${slug}`);
  revalidatePath(`/cases/${slug}`);
  revalidatePath("/reports");
}

function revalidateVerificationSurfaces(userId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/verification");
  revalidatePath(`/user/${userId}`);
  revalidatePath("/reports");
}

export async function adminCaseReviewAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.CASE_REVIEW);
  const slug = normalizeText(formData.get("slug"));
  const intent = normalizeText(formData.get("intent"));
  const note = normalizeText(formData.get("reviewNote"));

  if (!slug || !intent) {
    throw new Error("Missing case review input");
  }

  const caseRecord = await prisma.caseRecord.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      authorId: true,
      publishedAt: true,
      revisions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!caseRecord) {
    throw new Error("Case record not found");
  }

  if (intent === "publish") {
    if (caseRecord.status !== RepositoryItemStatus.PENDING_REVIEW) {
      throw new Error("Only pending review cases can be published");
    }
  } else if (intent === "reject") {
    if (caseRecord.status !== RepositoryItemStatus.PENDING_REVIEW) {
      throw new Error("Only pending review cases can be rejected");
    }
    if (!note) {
      throw new Error("A rejection reason is required");
    }
  } else if (intent === "archive") {
    if (caseRecord.status !== RepositoryItemStatus.PUBLISHED && caseRecord.status !== RepositoryItemStatus.REJECTED) {
      throw new Error("Only published or rejected cases can be archived");
    }
    if (!note) {
      throw new Error("An archive reason is required");
    }
  } else if (intent === "restore") {
    if (caseRecord.status !== RepositoryItemStatus.ARCHIVED && caseRecord.status !== RepositoryItemStatus.REMOVED) {
      throw new Error("Only archived or removed cases can be restored");
    }
  } else if (intent === "save_note") {
    if (!note) {
      throw new Error("A reviewer note is required");
    }
  } else {
    throw new Error("Unsupported case review action");
  }

  const now = new Date();
  const latestRevisionId = caseRecord.revisions[0]?.id ?? null;

  await prisma.$transaction(async (tx) => {
    if (intent === "publish") {
      await tx.caseRecord.update({
        where: { id: caseRecord.id },
        data: {
          status: RepositoryItemStatus.PUBLISHED,
          reviewedById: actorId,
          reviewedAt: now,
          publishedAt: now,
        },
      });

      if (latestRevisionId) {
        await tx.caseRevision.update({
          where: { id: latestRevisionId },
          data: {
            status: RepositoryItemStatus.PUBLISHED,
            reviewedById: actorId,
            reviewedAt: now,
            ...(note ? { changeSummary: note } : {}),
          },
        });
      }

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: caseRecord.authorId,
          caseId: caseRecord.id,
          actionType: ModerationActionType.CASE_PUBLISHED,
          note: note || null,
        },
      });

      await tx.notification.create({
        data: {
          userId: caseRecord.authorId,
          actorId,
          caseId: caseRecord.id,
          type: NotificationType.CASE_PUBLISHED,
          title: "Case published",
          message: note || `Your case "${caseRecord.title}" was published to the repository.`,
          data: {
            source: "admin_case_review_publish",
          },
        },
      });

      await tx.gamificationEvent.create({
        data: {
          userId: caseRecord.authorId,
          eventType: "CASE_PUBLISHED",
          pointsDelta: 0,
          caseId: caseRecord.id,
        },
      });

      await tx.userGamification.upsert({
        where: { userId: caseRecord.authorId },
        update: {
          casesPublished: { increment: caseRecord.publishedAt ? 0 : 1 },
          lastContributionAt: now,
        },
        create: {
          userId: caseRecord.authorId,
          casesPublished: caseRecord.publishedAt ? 0 : 1,
          lastContributionAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.CASE_REPOSITORY,
          action: "ADMIN_CASE_PUBLISH",
          actorId,
          targetUserId: caseRecord.authorId,
          targetType: ContentTargetType.CASE,
          targetId: caseRecord.id,
          meta: {
            slug: caseRecord.slug,
            previousStatus: caseRecord.status,
            note: note || null,
          },
        },
      });
    } else if (intent === "reject") {
      await tx.caseRecord.update({
        where: { id: caseRecord.id },
        data: {
          status: RepositoryItemStatus.REJECTED,
          reviewedById: actorId,
          reviewedAt: now,
        },
      });

      if (latestRevisionId) {
        await tx.caseRevision.update({
          where: { id: latestRevisionId },
          data: {
            status: RepositoryItemStatus.REJECTED,
            reviewedById: actorId,
            reviewedAt: now,
            changeSummary: note,
          },
        });
      }

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: caseRecord.authorId,
          caseId: caseRecord.id,
          actionType: ModerationActionType.CASE_REJECTED,
          reason: note,
          note,
        },
      });

      await tx.notification.create({
        data: {
          userId: caseRecord.authorId,
          actorId,
          caseId: caseRecord.id,
          type: NotificationType.SYSTEM,
          title: "Case review update",
          message: `Your case "${caseRecord.title}" was rejected for publication. Reason: ${note}`,
          data: {
            source: "admin_case_review_reject",
            reason: note,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.CASE_REPOSITORY,
          action: "ADMIN_CASE_REJECT",
          actorId,
          targetUserId: caseRecord.authorId,
          targetType: ContentTargetType.CASE,
          targetId: caseRecord.id,
          meta: {
            slug: caseRecord.slug,
            previousStatus: caseRecord.status,
            reason: note,
          },
        },
      });
    } else if (intent === "archive") {
      await tx.caseRecord.update({
        where: { id: caseRecord.id },
        data: {
          status: RepositoryItemStatus.ARCHIVED,
          reviewedById: actorId,
          reviewedAt: now,
        },
      });

      if (latestRevisionId) {
        await tx.caseRevision.update({
          where: { id: latestRevisionId },
          data: {
            status: RepositoryItemStatus.ARCHIVED,
            reviewedById: actorId,
            reviewedAt: now,
            changeSummary: note,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          category: AuditCategory.CASE_REPOSITORY,
          action: "ADMIN_CASE_ARCHIVE",
          actorId,
          targetUserId: caseRecord.authorId,
          targetType: ContentTargetType.CASE,
          targetId: caseRecord.id,
          meta: {
            slug: caseRecord.slug,
            previousStatus: caseRecord.status,
            reason: note,
          },
        },
      });
    } else if (intent === "restore") {
      const restoredStatus = caseRecord.publishedAt ? RepositoryItemStatus.PUBLISHED : RepositoryItemStatus.PENDING_REVIEW;

      await tx.caseRecord.update({
        where: { id: caseRecord.id },
        data: {
          status: restoredStatus,
          reviewedById: actorId,
          reviewedAt: now,
        },
      });

      if (latestRevisionId) {
        await tx.caseRevision.update({
          where: { id: latestRevisionId },
          data: {
            status: restoredStatus,
            reviewedById: actorId,
            reviewedAt: now,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          category: AuditCategory.CASE_REPOSITORY,
          action: "ADMIN_CASE_RESTORE",
          actorId,
          targetUserId: caseRecord.authorId,
          targetType: ContentTargetType.CASE,
          targetId: caseRecord.id,
          meta: {
            slug: caseRecord.slug,
            previousStatus: caseRecord.status,
            restoredStatus,
          },
        },
      });
    } else if (intent === "save_note") {
      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: caseRecord.authorId,
          caseId: caseRecord.id,
          actionType: ModerationActionType.NOTE_ADDED,
          note,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.CASE_REPOSITORY,
          action: "ADMIN_CASE_NOTE_ADDED",
          actorId,
          targetUserId: caseRecord.authorId,
          targetType: ContentTargetType.CASE,
          targetId: caseRecord.id,
          meta: {
            slug: caseRecord.slug,
            note,
          },
        },
      });
    }
  });

  revalidateCaseSurfaces(caseRecord.slug);
}

export async function adminVerificationDecisionAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.VERIFICATION_REVIEW);
  const requestId = normalizeText(formData.get("requestId"));
  const intent = normalizeText(formData.get("intent"));
  const note = normalizeText(formData.get("decisionNote"));

  if (!requestId || !intent) {
    throw new Error("Missing verification input");
  }

  const request = await prisma.lawyerVerificationRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      lawyerProfileId: true,
      lawyerProfile: {
        select: {
          userId: true,
          user: { select: { displayName: true } },
        },
      },
    },
  });

  if (!request) {
    throw new Error("Verification request not found");
  }

  if (
    request.status !== LawyerVerificationStatus.PENDING &&
    request.status !== LawyerVerificationStatus.UNDER_REVIEW
  ) {
    throw new Error("Only pending or under-review requests can be decided");
  }

  if (intent === "reject" && !note) {
    throw new Error("A rejection reason is required");
  }

  if (!["approve", "reject"].includes(intent)) {
    throw new Error("Unsupported verification action");
  }

  const now = new Date();
  const userId = request.lawyerProfile.userId;
  const displayName = request.lawyerProfile.user.displayName ?? "User";

  await prisma.$transaction(async (tx) => {
    if (intent === "approve") {
      await tx.lawyerVerificationRequest.update({
        where: { id: request.id },
        data: {
          status: LawyerVerificationStatus.VERIFIED,
          reviewedAt: now,
          reviewedById: actorId,
          rejectionReason: null,
          adminNote: note || null,
        },
      });

      await tx.lawyerVerificationRequest.updateMany({
        where: {
          lawyerProfileId: request.lawyerProfileId,
          id: { not: request.id },
          status: { in: [LawyerVerificationStatus.PENDING, LawyerVerificationStatus.UNDER_REVIEW] },
        },
        data: {
          status: LawyerVerificationStatus.EXPIRED,
          reviewedAt: now,
          reviewedById: actorId,
          adminNote: "Superseded by approved verification request.",
        },
      });

      await tx.lawyerProfile.update({
        where: { id: request.lawyerProfileId },
        data: {
          verificationStatus: LawyerVerificationStatus.VERIFIED,
          verifiedAt: now,
          verifiedById: actorId,
        },
      });

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: userId,
          actionType: ModerationActionType.VERIFICATION_APPROVED,
          note: note || null,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          actorId,
          type: NotificationType.VERIFICATION_APPROVED,
          title: "Lawyer verification approved",
          message: note || `Your lawyer verification request has been approved.`,
          data: {
            source: "admin_verification_approve",
          },
        },
      });

      await tx.gamificationEvent.create({
        data: {
          userId,
          eventType: "LAWYER_VERIFIED",
          pointsDelta: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.VERIFICATION,
          action: "ADMIN_VERIFICATION_APPROVE",
          actorId,
          targetUserId: userId,
          targetType: ContentTargetType.USER,
          targetId: userId,
          meta: {
            requestId: request.id,
            previousStatus: request.status,
            note: note || null,
          },
        },
      });
    } else {
      await tx.lawyerVerificationRequest.update({
        where: { id: request.id },
        data: {
          status: LawyerVerificationStatus.REJECTED,
          reviewedAt: now,
          reviewedById: actorId,
          rejectionReason: note,
          adminNote: note,
        },
      });

      await tx.lawyerProfile.update({
        where: { id: request.lawyerProfileId },
        data: {
          verificationStatus: LawyerVerificationStatus.REJECTED,
          verifiedAt: null,
          verifiedById: null,
        },
      });

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: userId,
          actionType: ModerationActionType.VERIFICATION_REJECTED,
          reason: note,
          note,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          actorId,
          type: NotificationType.VERIFICATION_REJECTED,
          title: "Lawyer verification rejected",
          message: `Your lawyer verification request was rejected. Reason: ${note}`,
          data: {
            source: "admin_verification_reject",
            reason: note,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          category: AuditCategory.VERIFICATION,
          action: "ADMIN_VERIFICATION_REJECT",
          actorId,
          targetUserId: userId,
          targetType: ContentTargetType.USER,
          targetId: userId,
          meta: {
            requestId: request.id,
            previousStatus: request.status,
            reason: note,
          },
        },
      });
    }
  });

  revalidateVerificationSurfaces(userId);
}
