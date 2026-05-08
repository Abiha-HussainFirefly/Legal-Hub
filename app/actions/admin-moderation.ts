"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  AIAlertStatus,
  AuditCategory,
  ContentStatus,
  ContentTargetType,
  ModerationActionType,
  NotificationType,
  ReportStatus,
  RepositoryItemStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
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

function revalidateModerationSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/moderation");
  revalidatePath("/reports");
}

function notificationMessage(intent: string, note: string) {
  if (intent === "dismiss") return note || "A report about your content was reviewed and dismissed.";
  if (intent === "resolve") return note || "A report about your content was reviewed and resolved.";
  if (intent === "hide_target") return note || "Your content was hidden by the moderation team.";
  return note || "A moderation event affected your content.";
}

async function hideModerationTarget(tx: Prisma.TransactionClient, target: {
  discussionId: string | null;
  answerId: string | null;
  commentId: string | null;
  caseId: string | null;
}) {
  if (target.discussionId) {
    await tx.discussion.update({
      where: { id: target.discussionId },
      data: { contentStatus: ContentStatus.HIDDEN },
    });
    return {
      targetType: ContentTargetType.DISCUSSION,
      actionType: ModerationActionType.CONTENT_HIDDEN,
      targetId: target.discussionId,
    };
  }

  if (target.answerId) {
    await tx.answer.update({
      where: { id: target.answerId },
      data: { status: ContentStatus.HIDDEN },
    });
    return {
      targetType: ContentTargetType.ANSWER,
      actionType: ModerationActionType.CONTENT_HIDDEN,
      targetId: target.answerId,
    };
  }

  if (target.commentId) {
    await tx.comment.update({
      where: { id: target.commentId },
      data: { status: ContentStatus.HIDDEN },
    });
    return {
      targetType: ContentTargetType.COMMENT,
      actionType: ModerationActionType.CONTENT_HIDDEN,
      targetId: target.commentId,
    };
  }

  if (target.caseId) {
    await tx.caseRecord.update({
      where: { id: target.caseId },
      data: { status: RepositoryItemStatus.REMOVED },
    });
    return {
      targetType: ContentTargetType.CASE,
      actionType: ModerationActionType.CONTENT_REMOVED,
      targetId: target.caseId,
    };
  }

  throw new Error("No moderation target found");
}

export async function adminReportWorkflowAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.MODERATION_MANAGE);
  const reportId = normalizeText(formData.get("reportId"));
  const intent = normalizeText(formData.get("intent"));
  const note = normalizeText(formData.get("note"));

  if (!reportId || !intent) {
    throw new Error("Missing report moderation input");
  }

  const report = await prisma.contentReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      reportedUserId: true,
      discussionId: true,
      answerId: true,
      commentId: true,
      caseId: true,
    },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  if (intent === "under_review") {
    if (!note) {
      throw new Error("A review note is required");
    }
  } else if (intent === "dismiss") {
    if (!note) {
      throw new Error("A dismissal note is required");
    }
  } else if (intent === "resolve") {
    if (!note) {
      throw new Error("A resolution note is required");
    }
  } else if (intent === "hide_target") {
    if (!note) {
      throw new Error("A moderation reason is required");
    }
  } else {
    throw new Error("Unsupported report action");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (intent === "under_review") {
      await tx.contentReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.UNDER_REVIEW,
          reviewedById: actorId,
          reviewedAt: now,
          resolutionNote: note,
        },
      });
    } else if (intent === "dismiss") {
      await tx.contentReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.DISMISSED,
          reviewedById: actorId,
          reviewedAt: now,
          resolutionNote: note,
        },
      });
    } else if (intent === "resolve") {
      await tx.contentReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.RESOLVED,
          reviewedById: actorId,
          reviewedAt: now,
          resolutionNote: note,
        },
      });
    } else if (intent === "hide_target") {
      const hiddenTarget = await hideModerationTarget(tx, report);

      await tx.contentReport.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.ACTIONED,
          reviewedById: actorId,
          reviewedAt: now,
          resolutionNote: note,
        },
      });

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: report.reportedUserId ?? null,
          discussionId: report.discussionId,
          answerId: report.answerId,
          commentId: report.commentId,
          caseId: report.caseId,
          reportId: report.id,
          actionType: hiddenTarget.actionType,
          reason: note,
          note,
        },
      });

      if (report.reportedUserId) {
        await tx.notification.create({
          data: {
            userId: report.reportedUserId,
            actorId,
            discussionId: report.discussionId,
            answerId: report.answerId,
            commentId: report.commentId,
            caseId: report.caseId,
            type: NotificationType.REPORT_UPDATE,
            title: "Moderation action taken",
            message: notificationMessage(intent, note),
            data: {
              source: "admin_report_hide_target",
            },
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        category: AuditCategory.MODERATION,
        action: `ADMIN_REPORT_${intent.toUpperCase()}`,
        actorId,
        targetUserId: report.reportedUserId ?? null,
        targetType:
          report.discussionId ? ContentTargetType.DISCUSSION :
          report.answerId ? ContentTargetType.ANSWER :
          report.commentId ? ContentTargetType.COMMENT :
          report.caseId ? ContentTargetType.CASE :
          ContentTargetType.USER,
        targetId: report.discussionId ?? report.answerId ?? report.commentId ?? report.caseId ?? report.reportedUserId ?? report.id,
        meta: {
          reportId: report.id,
          previousStatus: report.status,
          note,
        },
      },
    });
  });

  revalidateModerationSurfaces();
}

export async function adminAlertWorkflowAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.MODERATION_MANAGE);
  const alertId = normalizeText(formData.get("alertId"));
  const intent = normalizeText(formData.get("intent"));
  const note = normalizeText(formData.get("note"));

  if (!alertId || !intent) {
    throw new Error("Missing AI alert moderation input");
  }

  const alert = await prisma.aIAlert.findUnique({
    where: { id: alertId },
    select: {
      id: true,
      status: true,
      discussionId: true,
      answerId: true,
      commentId: true,
      caseId: true,
    },
  });

  if (!alert) {
    throw new Error("AI alert not found");
  }

  if ((intent === "resolve" || intent === "false_positive" || intent === "hide_target") && !note) {
    throw new Error("A moderation note is required");
  }

  if (!["acknowledge", "resolve", "false_positive", "hide_target"].includes(intent)) {
    throw new Error("Unsupported AI alert action");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (intent === "acknowledge") {
      await tx.aIAlert.update({
        where: { id: alert.id },
        data: {
          status: AIAlertStatus.ACKNOWLEDGED,
          reviewedById: actorId,
          reviewedAt: now,
        },
      });
    } else if (intent === "resolve") {
      await tx.aIAlert.update({
        where: { id: alert.id },
        data: {
          status: AIAlertStatus.RESOLVED,
          reviewedById: actorId,
          reviewedAt: now,
        },
      });
    } else if (intent === "false_positive") {
      await tx.aIAlert.update({
        where: { id: alert.id },
        data: {
          status: AIAlertStatus.FALSE_POSITIVE,
          reviewedById: actorId,
          reviewedAt: now,
        },
      });
    } else if (intent === "hide_target") {
      const hiddenTarget = await hideModerationTarget(tx, alert);

      await tx.aIAlert.update({
        where: { id: alert.id },
        data: {
          status: AIAlertStatus.RESOLVED,
          reviewedById: actorId,
          reviewedAt: now,
        },
      });

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          discussionId: alert.discussionId,
          answerId: alert.answerId,
          commentId: alert.commentId,
          caseId: alert.caseId,
          aiAlertId: alert.id,
          actionType: hiddenTarget.actionType,
          reason: note,
          note,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        category: AuditCategory.MODERATION,
        action: `ADMIN_AI_ALERT_${intent.toUpperCase()}`,
        actorId,
        targetType:
          alert.discussionId ? ContentTargetType.DISCUSSION :
          alert.answerId ? ContentTargetType.ANSWER :
          alert.commentId ? ContentTargetType.COMMENT :
          alert.caseId ? ContentTargetType.CASE :
          null,
        targetId: alert.discussionId ?? alert.answerId ?? alert.commentId ?? alert.caseId ?? alert.id,
        meta: {
          alertId: alert.id,
          previousStatus: alert.status,
          note: note || null,
        },
      },
    });
  });

  revalidateModerationSurfaces();
}
