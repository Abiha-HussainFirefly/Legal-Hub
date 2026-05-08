"use server";

import { auth } from "@/auth";
import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  AuditCategory,
  ContentStatus,
  ContentTargetType,
  DiscussionStatus,
  ModerationActionType,
  SummaryStatus,
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

function revalidateDiscussionSurfaces(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/discussion-ops");
  revalidatePath(`/discussion-ops/${slug}`);
  revalidatePath(`/discussions/${slug}`);
  revalidatePath("/moderation");
  revalidatePath("/reports");
}

export async function adminDiscussionWorkflowAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.DISCUSSIONS_MANAGE);
  const discussionId = normalizeText(formData.get("discussionId"));
  const slug = normalizeText(formData.get("slug"));
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!discussionId || !slug || !intent) {
    throw new Error("Missing discussion action input");
  }

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    select: {
      id: true,
      slug: true,
      authorId: true,
      status: true,
      contentStatus: true,
      isPinned: true,
    },
  });

  if (!discussion) {
    throw new Error("Discussion not found");
  }

  const mutatingIntents = new Set([
    "lock",
    "close",
    "resolve",
    "hide",
    "remove",
    "restore",
    "pin",
    "unpin",
    "mark_summary_stale",
    "suppress_summaries",
    "save_note",
  ]);

  if (!mutatingIntents.has(intent)) {
    throw new Error("Unsupported discussion action");
  }

  if (intent !== "pin" && intent !== "unpin" && !reason) {
    throw new Error("A reason is required for this action");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (intent === "lock") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          status: DiscussionStatus.LOCKED,
          lockedAt: now,
        },
      });
    } else if (intent === "close") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          status: DiscussionStatus.CLOSED,
          closedAt: now,
        },
      });
    } else if (intent === "resolve") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          status: DiscussionStatus.RESOLVED,
          resolvedById: actorId,
          resolvedAt: now,
        },
      });
    } else if (intent === "hide") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          status: DiscussionStatus.HIDDEN,
          contentStatus: ContentStatus.HIDDEN,
        },
      });

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: discussion.authorId,
          discussionId: discussion.id,
          actionType: ModerationActionType.CONTENT_HIDDEN,
          reason,
          note: reason,
        },
      });
    } else if (intent === "remove") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          status: DiscussionStatus.HIDDEN,
          contentStatus: ContentStatus.REMOVED,
        },
      });

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: discussion.authorId,
          discussionId: discussion.id,
          actionType: ModerationActionType.CONTENT_REMOVED,
          reason,
          note: reason,
        },
      });
    } else if (intent === "restore") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          status: DiscussionStatus.OPEN,
          contentStatus: ContentStatus.ACTIVE,
          closedAt: null,
          lockedAt: null,
        },
      });

      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: discussion.authorId,
          discussionId: discussion.id,
          actionType: ModerationActionType.CONTENT_RESTORED,
          reason,
          note: reason,
        },
      });
    } else if (intent === "pin") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          isPinned: true,
          pinnedUntil: null,
        },
      });
    } else if (intent === "unpin") {
      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          isPinned: false,
          pinnedUntil: null,
        },
      });
    } else if (intent === "mark_summary_stale") {
      await tx.discussionAISummary.updateMany({
        where: {
          discussionId: discussion.id,
          isCurrent: true,
        },
        data: {
          status: SummaryStatus.STALE,
        },
      });
    } else if (intent === "suppress_summaries") {
      await tx.discussionAISummary.updateMany({
        where: {
          discussionId: discussion.id,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
          status: SummaryStatus.STALE,
        },
      });
    } else if (intent === "save_note") {
      await tx.moderationAction.create({
        data: {
          moderatorId: actorId,
          targetUserId: discussion.authorId,
          discussionId: discussion.id,
          actionType: ModerationActionType.NOTE_ADDED,
          note: reason,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        category: AuditCategory.CONTENT,
        action: `ADMIN_DISCUSSION_${intent.toUpperCase()}`,
        actorId,
        targetUserId: discussion.authorId,
        targetType: ContentTargetType.DISCUSSION,
        targetId: discussion.id,
        meta: {
          slug,
          previousStatus: discussion.status,
          previousContentStatus: discussion.contentStatus,
          previousPinned: discussion.isPinned,
          reason: reason || null,
        },
      },
    });
  });

  revalidateDiscussionSurfaces(slug);
}

export async function adminDiscussionAnswerAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.DISCUSSIONS_MANAGE);
  const answerId = normalizeText(formData.get("answerId"));
  const slug = normalizeText(formData.get("slug"));
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!answerId || !slug || !intent || !reason) {
    throw new Error("Missing answer moderation input");
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: {
      id: true,
      status: true,
      authorId: true,
      discussionId: true,
    },
  });

  if (!answer) {
    throw new Error("Answer not found");
  }

  if (!["hide", "restore"].includes(intent)) {
    throw new Error("Unsupported answer moderation action");
  }

  await prisma.$transaction(async (tx) => {
    const nextStatus = intent === "hide" ? ContentStatus.HIDDEN : ContentStatus.ACTIVE;

    await tx.answer.update({
      where: { id: answer.id },
      data: { status: nextStatus },
    });

    await tx.moderationAction.create({
      data: {
        moderatorId: actorId,
        targetUserId: answer.authorId,
        discussionId: answer.discussionId,
        answerId: answer.id,
        actionType: intent === "hide" ? ModerationActionType.CONTENT_HIDDEN : ModerationActionType.CONTENT_RESTORED,
        reason,
        note: reason,
      },
    });

    await tx.auditLog.create({
      data: {
        category: AuditCategory.MODERATION,
        action: `ADMIN_DISCUSSION_ANSWER_${intent.toUpperCase()}`,
        actorId,
        targetUserId: answer.authorId,
        targetType: ContentTargetType.ANSWER,
        targetId: answer.id,
        meta: {
          discussionSlug: slug,
          previousStatus: answer.status,
          reason,
        },
      },
    });
  });

  revalidateDiscussionSurfaces(slug);
}

export async function adminDiscussionCommentAction(formData: FormData) {
  const { actorId } = await requireAdminActor(ADMIN_PERMISSION_KEYS.DISCUSSIONS_MANAGE);
  const commentId = normalizeText(formData.get("commentId"));
  const slug = normalizeText(formData.get("slug"));
  const intent = normalizeText(formData.get("intent"));
  const reason = normalizeText(formData.get("reason"));

  if (!commentId || !slug || !intent || !reason) {
    throw new Error("Missing comment moderation input");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      status: true,
      authorId: true,
      discussionId: true,
      answer: {
        select: {
          discussionId: true,
        },
      },
    },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (!["hide", "restore"].includes(intent)) {
    throw new Error("Unsupported comment moderation action");
  }

  const discussionId = comment.discussionId ?? comment.answer?.discussionId ?? null;

  await prisma.$transaction(async (tx) => {
    const nextStatus = intent === "hide" ? ContentStatus.HIDDEN : ContentStatus.ACTIVE;

    await tx.comment.update({
      where: { id: comment.id },
      data: { status: nextStatus },
    });

    await tx.moderationAction.create({
      data: {
        moderatorId: actorId,
        targetUserId: comment.authorId,
        discussionId,
        commentId: comment.id,
        actionType: intent === "hide" ? ModerationActionType.CONTENT_HIDDEN : ModerationActionType.CONTENT_RESTORED,
        reason,
        note: reason,
      },
    });

    await tx.auditLog.create({
      data: {
        category: AuditCategory.MODERATION,
        action: `ADMIN_DISCUSSION_COMMENT_${intent.toUpperCase()}`,
        actorId,
        targetUserId: comment.authorId,
        targetType: ContentTargetType.COMMENT,
        targetId: comment.id,
        meta: {
          discussionSlug: slug,
          previousStatus: comment.status,
          reason,
        },
      },
    });
  });

  revalidateDiscussionSurfaces(slug);
}
