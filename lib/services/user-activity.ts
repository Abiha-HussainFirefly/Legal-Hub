import type { Prisma } from "@prisma/client";

type ActivityIncrementInput = Partial<{
  discussionCount: number;
  answerCount: number;
  commentCount: number;
  caseCount: number;
  reactionReceivedCount: number;
  profileViewCount: number;
  badgeCount: number;
  engagementScore: number;
}>;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function upsertUserActivityDaily(
  tx: Prisma.TransactionClient,
  userId: string,
  increments: ActivityIncrementInput,
  activityDate = new Date(),
) {
  const normalizedDate = startOfUtcDay(activityDate);

  return tx.userActivityDaily.upsert({
    where: {
      userId_activityDate: {
        userId,
        activityDate: normalizedDate,
      },
    },
    update: {
      discussionCount: { increment: increments.discussionCount ?? 0 },
      answerCount: { increment: increments.answerCount ?? 0 },
      commentCount: { increment: increments.commentCount ?? 0 },
      caseCount: { increment: increments.caseCount ?? 0 },
      reactionReceivedCount: { increment: increments.reactionReceivedCount ?? 0 },
      profileViewCount: { increment: increments.profileViewCount ?? 0 },
      badgeCount: { increment: increments.badgeCount ?? 0 },
      engagementScore: { increment: increments.engagementScore ?? 0 },
    },
    create: {
      userId,
      activityDate: normalizedDate,
      discussionCount: increments.discussionCount ?? 0,
      answerCount: increments.answerCount ?? 0,
      commentCount: increments.commentCount ?? 0,
      caseCount: increments.caseCount ?? 0,
      reactionReceivedCount: increments.reactionReceivedCount ?? 0,
      profileViewCount: increments.profileViewCount ?? 0,
      badgeCount: increments.badgeCount ?? 0,
      engagementScore: increments.engagementScore ?? 0,
    },
  });
}

export function getNormalizedActivityDate(date: Date) {
  return startOfUtcDay(date);
}
