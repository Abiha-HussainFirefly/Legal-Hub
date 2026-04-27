import { prisma } from '@/lib/prisma';
import { upsertUserActivityDaily } from '@/lib/services/user-activity';
import type { Prisma, ReportReason } from '@prisma/client';
import type {
  CreateDiscussionInput, UpdateDiscussionInput,
  CreateAnswerInput, CreateCommentInput,
  ReactInput, DiscussionFilters,
} from '@/types/discussion';

const NON_DEMO_USER_FILTER = {
  identifiers: {
    none: {
      type: 'EMAIL' as const,
      value: {
        endsWith: '@legalhub.demo',
      },
    },
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────

function makeSlug(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base}-${Date.now().toString(36)}`;
}

const PTS = {
  DISCUSSION_CREATED: 5,
  ANSWER_POSTED: 10,
  COMMENT_POSTED: 2,
  ANSWER_ACCEPTED: 15,
  DISCUSSION_REACTION_RECEIVED: 2,
  ANSWER_REACTION_RECEIVED: 2,
  COMMENT_REACTION_RECEIVED: 1,
};

export const AUTHOR_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
  profile: {
    select: {
      username: true,
      isLawyer: true,
      headline: true,
      primaryRegion: { select: { name: true } },
    },
  },
  lawyerProfile: { select: { verificationStatus: true, barCouncil: true, firmName: true } },
} as const;

export async function finalizeDiscussionCreation(discussionId: string, authorId: string) {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.userStats.upsert({
      where: { userId: authorId },
      update: { discussionCount: { increment: 1 }, lastContributionAt: now },
      create: { userId: authorId, discussionCount: 1, lastContributionAt: now },
    });

    await tx.gamificationEvent.create({
      data: {
        userId: authorId,
        eventType: 'DISCUSSION_CREATED',
        pointsDelta: PTS.DISCUSSION_CREATED,
        discussionId,
      },
    });

    await tx.userGamification.upsert({
      where: { userId: authorId },
      update: { totalPoints: { increment: PTS.DISCUSSION_CREATED }, lastContributionAt: now },
      create: { userId: authorId, totalPoints: PTS.DISCUSSION_CREATED, lastContributionAt: now },
    });

    await upsertUserActivityDaily(tx, authorId, {
      discussionCount: 1,
      engagementScore: PTS.DISCUSSION_CREATED,
    }, now);
  });
}

// ── DW-01: Create Discussion ──────────────────────────────────
export async function createDiscussion(authorId: string, input: CreateDiscussionInput) {
  const slug = makeSlug(input.title);

  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category || !category.isActive) throw new Error('Invalid or inactive category');
  if (category.scope === 'CASE') throw new Error('Category not available for discussions');

  if (input.regionId) {
    const reg = await prisma.region.findUnique({ where: { id: input.regionId } });
    if (!reg || !reg.isActive) throw new Error('Invalid region');
  }

  if (input.tagIds?.length) {
    const tags = await prisma.tag.findMany({ where: { id: { in: input.tagIds }, isActive: true } });
    if (tags.length !== input.tagIds.length) throw new Error('One or more tags are invalid');
  }

  return prisma.$transaction(async (tx) => {
    const disc = await tx.discussion.create({
      data: {
        slug,
        kind: input.kind,
        title: input.title,
        body: input.body,
        excerpt: input.excerpt ?? input.body.replace(/\n/g, ' ').slice(0, 200),
        authorId,
        categoryId: input.categoryId,
        regionId: input.regionId ?? null,
        visibility: input.visibility ?? 'PUBLIC',
        contentStatus: 'ACTIVE',
        status: 'OPEN',
        sourceUrl: input.sourceUrl ?? null,
        effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (input.tagIds?.length) {
      await tx.discussionTag.createMany({
        data: input.tagIds.map((tagId) => ({ discussionId: disc.id, tagId })),
        skipDuplicates: true,
      });
    }

    return disc;
  });
}

// ── DW-02: Edit Discussion ────────────────────────────────────
export async function editDiscussion(discussionId: string, editorId: string, input: UpdateDiscussionInput) {
  const disc = await prisma.discussion.findUnique({ where: { id: discussionId }, include: { tags: true } });
  if (!disc) throw new Error('Discussion not found');
  if (['REMOVED', 'DELETED'].includes(disc.contentStatus)) throw new Error('Cannot edit removed/deleted discussion');

  const latest = await prisma.discussionRevision.findFirst({ where: { discussionId }, orderBy: { version: 'desc' } });
  const version = (latest?.version ?? 0) + 1;

  return prisma.$transaction(async (tx) => {
    await tx.discussionRevision.create({
      data: {
        discussionId,
        editorId,
        version,
        changeSummary: input.changeSummary,
        snapshot: {
          title: disc.title,
          body: disc.body,
          excerpt: disc.excerpt,
          visibility: disc.visibility,
          tagIds: disc.tags.map(t => t.tagId),
        },
      },
    });

    const updated = await tx.discussion.update({
      where: { id: discussionId },
      data: {
        ...(input.title        !== undefined && { title:        input.title }),
        ...(input.body         !== undefined && { body:         input.body }),
        ...(input.excerpt      !== undefined && { excerpt:      input.excerpt }),
        ...(input.visibility   !== undefined && { visibility:   input.visibility }),
        ...(input.sourceUrl    !== undefined && { sourceUrl:    input.sourceUrl }),
        ...(input.effectiveDate !== undefined && { effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : null }),
        updatedAt: new Date(),
      },
    });

    if (input.tagIds !== undefined) {
      await tx.discussionTag.deleteMany({ where: { discussionId } });
      if (input.tagIds.length) {
        await tx.discussionTag.createMany({ data: input.tagIds.map(tagId => ({ discussionId, tagId })), skipDuplicates: true });
      }
    }
    return updated;
  });
}

// ── DW-03: Post Answer ────────────────────────────────────────
export async function postAnswer(authorId: string, discussionId: string, input: CreateAnswerInput) {
  const disc = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!disc) throw new Error('Discussion not found');
  if (disc.status === 'LOCKED' || disc.status === 'DELETED') throw new Error('Discussion is locked or deleted');
  if (['REMOVED', 'DELETED'].includes(disc.contentStatus)) throw new Error('Discussion is unavailable');

  return prisma.$transaction(async (tx) => {
    const answer = await tx.answer.create({ data: { discussionId, authorId, body: input.body, status: 'ACTIVE' } });

    await tx.discussion.update({ where: { id: discussionId }, data: { answerCount: { increment: 1 }, lastActivityAt: new Date() } });

    await tx.userStats.upsert({
      where:  { userId: authorId },
      update: { answerCount: { increment: 1 }, lastContributionAt: new Date() },
      create: { userId: authorId, answerCount: 1, lastContributionAt: new Date() },
    });

    await tx.gamificationEvent.create({
      data: { userId: authorId, eventType: 'ANSWER_POSTED', pointsDelta: PTS.ANSWER_POSTED, answerId: answer.id, discussionId },
    });
    await tx.userGamification.upsert({
      where:  { userId: authorId },
      update: { totalPoints: { increment: PTS.ANSWER_POSTED }, lastContributionAt: new Date() },
      create: { userId: authorId, totalPoints: PTS.ANSWER_POSTED, lastContributionAt: new Date() },
    });

    await upsertUserActivityDaily(tx, authorId, {
      answerCount: 1,
      engagementScore: PTS.ANSWER_POSTED,
    });

    if (disc.authorId !== authorId) {
      await tx.notification.create({
        data: {
          userId: disc.authorId,
          actorId: authorId,
          discussionId,
          answerId: answer.id,
          type: 'NEW_ANSWER',
          title: 'New answer on your discussion',
          message: `Someone answered: "${disc.title.slice(0, 60)}"`,
        },
      });
    }
    return answer;
  });
}

// ── DW-04: Accept Answer ──────────────────────────────────────
export async function acceptAnswer(discussionId: string, answerId: string, actorId: string) {
  const disc = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!disc) throw new Error('Discussion not found');
  if (disc.authorId !== actorId) throw new Error('Only the discussion author can accept an answer');

  const answer = await prisma.answer.findUnique({ where: { id: answerId } });
  if (!answer || answer.discussionId !== discussionId) throw new Error('Answer not in this discussion');
  if (['REMOVED', 'DELETED'].includes(answer.status)) throw new Error('Cannot accept a removed answer');

  await prisma.$transaction(async (tx) => {
    if (disc.acceptedAnswerId && disc.acceptedAnswerId !== answerId) {
      await tx.answer.update({ where: { id: disc.acceptedAnswerId }, data: { isAccepted: false, acceptedAt: null } });
    }
    await tx.answer.update({ where: { id: answerId }, data: { isAccepted: true, acceptedAt: new Date() } });
    await tx.discussion.update({
      where: { id: discussionId },
      data: { acceptedAnswerId: answerId, status: 'RESOLVED', resolvedById: actorId, resolvedAt: new Date(), lastActivityAt: new Date() },
    });

    if (answer.authorId !== actorId) {
      await tx.userStats.upsert({
        where:  { userId: answer.authorId },
        update: { acceptedAnswerCount: { increment: 1 } },
        create: { userId: answer.authorId, acceptedAnswerCount: 1 },
      });
      await tx.gamificationEvent.create({
        data: { userId: answer.authorId, eventType: 'ANSWER_ACCEPTED', pointsDelta: PTS.ANSWER_ACCEPTED, answerId, discussionId },
      });
      await tx.userGamification.upsert({
        where:  { userId: answer.authorId },
        update: { totalPoints: { increment: PTS.ANSWER_ACCEPTED }, acceptedAnswers: { increment: 1 } },
        create: { userId: answer.authorId, totalPoints: PTS.ANSWER_ACCEPTED, acceptedAnswers: 1 },
      });
      await upsertUserActivityDaily(tx, answer.authorId, {
        engagementScore: PTS.ANSWER_ACCEPTED,
      });
      await tx.notification.create({
        data: {
          userId: answer.authorId,
          actorId,
          discussionId,
          answerId,
          type: 'ANSWER_ACCEPTED',
          title: 'Your answer was accepted!',
          message: `Accepted on: "${disc.title.slice(0, 60)}"`,
        },
      });
    }
  });
}

// ── DW-05: Create Comment ─────────────────────────────────────
export async function createComment(
  authorId: string,
  discussionId: string | undefined,
  answerId: string | undefined,
  parentId: string | undefined,
  input: CreateCommentInput,
) {
  if (!parentId && !discussionId && !answerId) throw new Error('Must provide a parent target');

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        authorId,
        body: input.body,
        status: 'ACTIVE',
        discussionId: discussionId ?? null,
        answerId: answerId ?? null,
        caseId: null,
        parentId: parentId ?? null,
      },
    });

    if (!parentId) {
      if (discussionId) await tx.discussion.update({ where: { id: discussionId }, data: { commentCount: { increment: 1 }, lastActivityAt: new Date() } });
      else if (answerId) await tx.answer.update({ where: { id: answerId }, data: { commentCount: { increment: 1 } } });
    }

    await tx.userStats.upsert({
      where:  { userId: authorId },
      update: { commentCount: { increment: 1 }, lastContributionAt: new Date() },
      create: { userId: authorId, commentCount: 1, lastContributionAt: new Date() },
    });
    await tx.gamificationEvent.create({
      data: { userId: authorId, eventType: 'COMMENT_POSTED', pointsDelta: PTS.COMMENT_POSTED, commentId: comment.id, discussionId: discussionId ?? null, answerId: answerId ?? null },
    });
    await tx.userGamification.upsert({
      where:  { userId: authorId },
      update: { totalPoints: { increment: PTS.COMMENT_POSTED } },
      create: { userId: authorId, totalPoints: PTS.COMMENT_POSTED },
    });

    await upsertUserActivityDaily(tx, authorId, {
      commentCount: 1,
      engagementScore: PTS.COMMENT_POSTED,
    });

    if (parentId) {
      const parent = await tx.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
      if (parent && parent.authorId !== authorId) {
        await tx.notification.create({
          data: {
            userId: parent.authorId,
            actorId: authorId,
            commentId: comment.id,
            type: 'COMMENT_REPLIED',
            title: 'New reply on your comment',
            message: 'Someone replied to your comment',
          },
        });
      }
    }
    return comment;
  });
}

// ── DW-07: React to Discussion ────────────────────────────────
// Schema: DiscussionReaction has emoji String? field
// Unique key: @@unique([discussionId, userId, emoji])
// This means: one user can react MULTIPLE times with DIFFERENT emojis
// but only ONCE per emoji. null emoji = standard reactionType vote.
export async function reactToDiscussion(userId: string, discussionId: string, input: ReactInput) {
  // emoji null = upvote/downvote style reaction (one per user regardless)
  // emoji set  = emoji reaction (one per emoji per user)
  const emoji = input.emoji ?? null;

  // For null emoji reactions, use the old unique key (discussionId, userId)
  // For emoji reactions, use the new 3-part key
  const existing = await prisma.discussionReaction.findFirst({
    where: {
      discussionId,
      userId,
      emoji: emoji, // null matches null, emoji matches emoji
    },
  });

  await prisma.$transaction(async (tx) => {
    const disc = await tx.discussion.findUnique({ where: { id: discussionId }, select: { authorId: true } });
    if (!disc) throw new Error('Discussion not found');

    if (existing) {
      // Same reaction exists — toggle it off
      await tx.discussionReaction.delete({ where: { id: existing.id } });
      await tx.discussion.update({
        where: { id: discussionId },
        data: { reactionCount: { decrement: 1 }, score: { decrement: 1 } },
      });
    } else {
      // New reaction — create it
      await tx.discussionReaction.create({
        data: {
          discussionId,
          userId,
          reactionType: input.reactionType,
          emoji: emoji, // can be null or an emoji string like '👍'
        },
      });
      await tx.discussion.update({
        where: { id: discussionId },
        data: { reactionCount: { increment: 1 }, score: { increment: 1 } },
      });

      if (disc.authorId !== userId) {
        await tx.gamificationEvent.create({
          data: { userId: disc.authorId, eventType: 'DISCUSSION_REACTION_RECEIVED', pointsDelta: PTS.DISCUSSION_REACTION_RECEIVED, discussionId },
        });
      await tx.userGamification.upsert({
        where:  { userId: disc.authorId },
        update: { totalPoints: { increment: PTS.DISCUSSION_REACTION_RECEIVED }, likesReceived: { increment: 1 } },
        create: { userId: disc.authorId, totalPoints: PTS.DISCUSSION_REACTION_RECEIVED, likesReceived: 1 },
      });
        await tx.userStats.upsert({
          where:  { userId: disc.authorId },
          update: { reactionReceivedCount: { increment: 1 } },
          create: { userId: disc.authorId, reactionReceivedCount: 1 },
        });
        await upsertUserActivityDaily(tx, disc.authorId, {
          reactionReceivedCount: 1,
          engagementScore: PTS.DISCUSSION_REACTION_RECEIVED,
        });
      }
    }
  });
}

// ── DW-07: React to Answer ────────────────────────────────────
// AnswerReaction has NO emoji field — standard unique([answerId, userId])
export async function reactToAnswer(userId: string, answerId: string, input: ReactInput) {
  const existing = await prisma.answerReaction.findUnique({ where: { answerId_userId: { answerId, userId } } });

  await prisma.$transaction(async (tx) => {
    const ans = await tx.answer.findUnique({ where: { id: answerId }, select: { authorId: true } });
    if (!ans) throw new Error('Answer not found');

    if (existing) {
      if (existing.reactionType === input.reactionType) {
        await tx.answerReaction.delete({ where: { answerId_userId: { answerId, userId } } });
        await tx.answer.update({ where: { id: answerId }, data: { reactionCount: { decrement: 1 }, score: { decrement: 1 } } });
      } else {
        await tx.answerReaction.update({
          where: { answerId_userId: { answerId, userId } },
          data: { reactionType: input.reactionType },
        });
      }
    } else {
      await tx.answerReaction.create({ data: { answerId, userId, reactionType: input.reactionType } });
      await tx.answer.update({ where: { id: answerId }, data: { reactionCount: { increment: 1 }, score: { increment: 1 } } });
      if (ans.authorId !== userId) {
        await tx.gamificationEvent.create({ data: { userId: ans.authorId, eventType: 'ANSWER_REACTION_RECEIVED', pointsDelta: PTS.ANSWER_REACTION_RECEIVED, answerId } });
        await tx.userGamification.upsert({
          where:  { userId: ans.authorId },
          update: { totalPoints: { increment: PTS.ANSWER_REACTION_RECEIVED }, likesReceived: { increment: 1 } },
          create: { userId: ans.authorId, totalPoints: PTS.ANSWER_REACTION_RECEIVED, likesReceived: 1 },
        });
        await upsertUserActivityDaily(tx, ans.authorId, {
          reactionReceivedCount: 1,
          engagementScore: PTS.ANSWER_REACTION_RECEIVED,
        });
      }
    }
  });
}

// ── DW-07: React to Comment ───────────────────────────────────
// CommentReaction has NO emoji field — standard unique([commentId, userId])
export async function reactToComment(userId: string, commentId: string, input: ReactInput) {
  const existing = await prisma.commentReaction.findUnique({ where: { commentId_userId: { commentId, userId } } });

  await prisma.$transaction(async (tx) => {
    const c = await tx.comment.findUnique({ where: { id: commentId }, select: { authorId: true } });
    if (!c) throw new Error('Comment not found');

    if (existing) {
      if (existing.reactionType === input.reactionType) {
        await tx.commentReaction.delete({ where: { commentId_userId: { commentId, userId } } });
        await tx.comment.update({ where: { id: commentId }, data: { reactionCount: { decrement: 1 }, score: { decrement: 1 } } });
      } else {
        await tx.commentReaction.update({
          where: { commentId_userId: { commentId, userId } },
          data: { reactionType: input.reactionType },
        });
      }
    } else {
      await tx.commentReaction.create({ data: { commentId, userId, reactionType: input.reactionType } });
      await tx.comment.update({ where: { id: commentId }, data: { reactionCount: { increment: 1 }, score: { increment: 1 } } });
      if (c.authorId !== userId) {
        await tx.gamificationEvent.create({ data: { userId: c.authorId, eventType: 'COMMENT_REACTION_RECEIVED', pointsDelta: PTS.COMMENT_REACTION_RECEIVED, commentId } });
        await tx.userGamification.upsert({
          where:  { userId: c.authorId },
          update: { totalPoints: { increment: PTS.COMMENT_REACTION_RECEIVED }, likesReceived: { increment: 1 } },
          create: { userId: c.authorId, totalPoints: PTS.COMMENT_REACTION_RECEIVED, likesReceived: 1 },
        });
        await upsertUserActivityDaily(tx, c.authorId, {
          reactionReceivedCount: 1,
          engagementScore: PTS.COMMENT_REACTION_RECEIVED,
        });
      }
    }
  });
}

// ── Follow / Unfollow ─────────────────────────────────────────
export async function toggleFollow(userId: string, discussionId: string) {
  const existing = await prisma.discussionFollow.findUnique({ where: { discussionId_userId: { discussionId, userId } } });
  if (existing) {
    await prisma.$transaction([
      prisma.discussionFollow.delete({ where: { discussionId_userId: { discussionId, userId } } }),
      prisma.discussion.update({ where: { id: discussionId }, data: { followerCount: { decrement: 1 } } }),
    ]);
    return { following: false };
  }
  const disc = await prisma.discussion.findUnique({ where: { id: discussionId }, select: { authorId: true } });
  await prisma.$transaction([
    prisma.discussionFollow.create({ data: { discussionId, userId } }),
    prisma.discussion.update({ where: { id: discussionId }, data: { followerCount: { increment: 1 } } }),
  ]);
  if (disc && disc.authorId !== userId) {
    await prisma.notification.create({
      data: { userId: disc.authorId, actorId: userId, discussionId, type: 'DISCUSSION_FOLLOWED', title: 'New follower on your discussion', message: 'Someone is now following your discussion' },
    });
  }
  return { following: true };
}

// ── Bookmark / Unbookmark ─────────────────────────────────────
export async function toggleBookmark(userId: string, discussionId: string) {
  const existing = await prisma.savedDiscussion.findUnique({ where: { discussionId_userId: { discussionId, userId } } });
  if (existing) {
    await prisma.$transaction([
      prisma.savedDiscussion.delete({ where: { discussionId_userId: { discussionId, userId } } }),
      prisma.discussion.update({ where: { id: discussionId }, data: { bookmarkCount: { decrement: 1 } } }),
    ]);
    return { saved: false };
  }
  await prisma.$transaction([
    prisma.savedDiscussion.create({ data: { discussionId, userId } }),
    prisma.discussion.update({ where: { id: discussionId }, data: { bookmarkCount: { increment: 1 } } }),
  ]);
  return { saved: true };
}

// ── Record View ───────────────────────────────────────────────
export async function recordView(discussionId: string, userId?: string, ipHash?: string, userAgent?: string) {
  try {
    await prisma.$transaction([
      prisma.discussionView.create({ data: { discussionId, userId: userId ?? null, ipHash: ipHash ?? null, userAgent: userAgent ?? null } }),
      prisma.discussion.update({ where: { id: discussionId }, data: { viewCount: { increment: 1 } } }),
    ]);
  } catch { /* non-critical */ }
}

// ── Soft delete ───────────────────────────────────────────────
export async function softDeleteDiscussion(id: string) {
  return prisma.discussion.update({ where: { id }, data: { contentStatus: 'DELETED', status: 'DELETED', deletedAt: new Date() } });
}

// ── WIDGET QUERIES ────────────────────────────────────────────
export async function getTopLawyersThisMonth(limit = 5) {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return prisma.user.findMany({
    where: {
      lawyerProfile: { isNot: null },
      gamificationEvents: { some: { createdAt: { gte: startOfMonth } } },
    },
    take: limit,
    orderBy: { gamification: { totalPoints: 'desc' } },
    select: {
      id: true, displayName: true, avatarUrl: true,
      lawyerProfile: { select: { firmName: true } },
      gamification: { select: { totalPoints: true } },
    },
  });
}

export async function getTrendingDiscussions(limit = 5) {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return prisma.discussion.findMany({
    where: { createdAt: { gte: lastWeek }, contentStatus: 'ACTIVE' },
    take: limit,
    orderBy: [{ answerCount: 'desc' }, { reactionCount: 'desc' }],
    select: { id: true, title: true, slug: true, answerCount: true, category: { select: { name: true, colorHex: true } } },
  });
}

export async function getRegionalHotTopics(limit = 5) {
  return prisma.region.findMany({
    where: { isActive: true },
    take: limit,
    select: {
      id: true, name: true, slug: true,
      _count: { select: { discussions: { where: { contentStatus: 'ACTIVE' } } } },
    },
    orderBy: { discussions: { _count: 'desc' } },
  });
}

// ── QUERIES ───────────────────────────────────────────────────
export async function listDiscussions(filters: DiscussionFilters, viewerId?: string) {
  const { page = 1, limit = 20, sort = 'latest' } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.DiscussionWhereInput = {
    contentStatus: 'ACTIVE',
    visibility: 'PUBLIC',
    author: NON_DEMO_USER_FILTER,
  };
  if (filters.kind)          where.kind              = filters.kind;
  if (filters.categoryId)    where.categoryId        = filters.categoryId;
  if (filters.regionId)      where.regionId          = filters.regionId;
  if (filters.status)        where.status            = filters.status;
  if (filters.authorId)      where.authorId          = filters.authorId;
  if (filters.savedByUserId) where.bookmarks         = { some: { userId: filters.savedByUserId } };
  if (filters.tagId)         where.tags              = { some: { tagId: filters.tagId } };
  if (filters.aiSummaryOnly) where.isAiSummaryReady  = true;
  if (filters.search?.trim()) {
    const query = filters.search.trim();
    where.OR = [
      { title:   { contains: query, mode: 'insensitive' } },
      { body:    { contains: query, mode: 'insensitive' } },
      { excerpt: { contains: query, mode: 'insensitive' } },
      { author:  { displayName: { contains: query, mode: 'insensitive' } } },
      { category:{ name:        { contains: query, mode: 'insensitive' } } },
      { region:  { name:        { contains: query, mode: 'insensitive' } } },
      { tags:    { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } },
    ];
  }

  const orderBy =
    sort === 'popular'    ? [{ score: 'desc' as const }, { createdAt: 'desc' as const }] :
    sort === 'unanswered' ? [{ answerCount: 'asc' as const }, { createdAt: 'desc' as const }] :
    sort === 'trending'   ? [{ lastActivityAt: 'desc' as const }, { reactionCount: 'desc' as const }] :
                            [{ isPinned: 'desc' as const }, { createdAt: 'desc' as const }];

  const [total, discussions] = await prisma.$transaction([
    prisma.discussion.count({ where }),
    prisma.discussion.findMany({
      where, skip, take: limit, orderBy,
      include: {
        author:   { select: AUTHOR_SELECT },
        category: { select: { id: true, name: true, slug: true, colorHex: true, iconName: true } },
        region:   { select: { id: true, name: true, slug: true } },
        tags:     { include: { tag: { select: { id: true, name: true, slug: true } } } },
        reactions: {
          select: {
            reactionType: true,
            emoji: true,
            userId: true,
            user: { select: { displayName: true } },
          },
        },
        ...(viewerId ? {
          followers: { where: { userId: viewerId }, select: { id: true } },
          bookmarks: { where: { userId: viewerId }, select: { id: true } },
        } : {}),
      },
    }),
  ]);

  return {
    data: discussions,
    meta: {
      total, page, limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}

export async function getDiscussionBySlug(slug: string, viewerId?: string) {
  return prisma.discussion.findUnique({
    where: { slug },
    include: {
      author:   { select: AUTHOR_SELECT },
      category: { select: { id: true, name: true, slug: true, colorHex: true, iconName: true } },
      region:   { select: { id: true, name: true, slug: true } },
      tags:     { include: { tag: { select: { id: true, name: true, slug: true } } } },
      aiSummaries: { where: { isCurrent: true, status: 'GENERATED' }, take: 1, orderBy: { version: 'desc' } },
      ...(viewerId ? {
        reactions: { where: { userId: viewerId }, select: { reactionType: true, emoji: true } },
        followers: { where: { userId: viewerId }, select: { id: true } },
        bookmarks: { where: { userId: viewerId }, select: { id: true } },
      } : {}),
      answers: {
        where: { status: 'ACTIVE' },
        orderBy: [{ isAccepted: 'desc' }, { score: 'desc' }, { createdAt: 'asc' }],
        include: {
          author: { select: AUTHOR_SELECT },
          // AnswerReaction has no emoji field
          ...(viewerId ? { reactions: { where: { userId: viewerId }, select: { reactionType: true } } } : {}),
          comments: {
            where: { status: 'ACTIVE', parentId: null },
            orderBy: { createdAt: 'asc' }, take: 5,
            include: {
              author:  { select: AUTHOR_SELECT },
              replies: { where: { status: 'ACTIVE' }, take: 3, orderBy: { createdAt: 'asc' }, include: { author: { select: AUTHOR_SELECT } } },
            },
          },
        },
      },
      comments: {
        where: { status: 'ACTIVE', parentId: null, answerId: null },
        orderBy: { createdAt: 'asc' }, take: 10,
        include: {
          author:  { select: AUTHOR_SELECT },
          replies: { where: { status: 'ACTIVE' }, take: 3, orderBy: { createdAt: 'asc' }, include: { author: { select: AUTHOR_SELECT } } },
        },
      },
    },
  });
}

export async function getDiscussionById(id: string, viewerId?: string) {
  const d = await prisma.discussion.findUnique({ where: { id }, select: { slug: true } });
  return d ? getDiscussionBySlug(d.slug, viewerId) : null;
}

export async function listNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [total, items, unreadCount] = await prisma.$transaction([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { data: items, unreadCount, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true, readAt: new Date() } });
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true, scope: { in: ['DISCUSSION', 'BOTH'] } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, colorHex: true, iconName: true },
  });
}

export async function getRegions() {
  return prisma.region.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, type: true },
  });
}

export async function getTags() {
  return prisma.tag.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, type: true },
  });
}

export async function boostDiscussion(userId: string, discussionId: string, boostType: 'BUMP' | 'FEATURE' | 'PIN', expiresAt?: Date) {
  const disc = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!disc) throw new Error('Discussion not found');

  return prisma.$transaction(async (tx) => {
    await tx.discussionBoost.create({ data: { discussionId, userId, boostType, expiresAt: expiresAt ?? null } });

    const updateData: Prisma.DiscussionUpdateInput = { boostCount: { increment: 1 } };
    if (boostType === 'PIN') { updateData.isPinned = true; if (expiresAt) updateData.pinnedUntil = expiresAt; }
    await tx.discussion.update({ where: { id: discussionId }, data: updateData });

    await tx.gamificationEvent.create({ data: { userId, eventType: 'DISCUSSION_BOOSTED', pointsDelta: 3, discussionId } });
    await tx.userGamification.upsert({
      where:  { userId },
      update: { totalPoints: { increment: 3 }, boostsUsed: { increment: 1 } },
      create: { userId, totalPoints: 3, boostsUsed: 1 },
    });
  });
}

export async function reportContent(
  reporterId: string,
  targetType: 'DISCUSSION' | 'ANSWER' | 'COMMENT' | 'USER',
  targetId: string,
  reason: string,
  description?: string,
) {
  let discussionId: string | null = null;
  let answerId:     string | null = null;
  let commentId:    string | null = null;
  let reportedUserId: string | null = null;

  if (targetType === 'DISCUSSION') {
    const d = await prisma.discussion.findUnique({ where: { id: targetId }, select: { id: true, authorId: true } });
    if (!d) throw new Error('Discussion not found');
    discussionId = d.id; reportedUserId = d.authorId;
  } else if (targetType === 'ANSWER') {
    const a = await prisma.answer.findUnique({ where: { id: targetId }, select: { id: true, authorId: true } });
    if (!a) throw new Error('Answer not found');
    answerId = a.id; reportedUserId = a.authorId;
  } else if (targetType === 'COMMENT') {
    const c = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true, authorId: true } });
    if (!c) throw new Error('Comment not found');
    commentId = c.id; reportedUserId = c.authorId;
  } else if (targetType === 'USER') {
    reportedUserId = targetId;
  }

  return prisma.contentReport.create({
    data: { reporterId, targetType, reason: reason as ReportReason, description, status: 'OPEN', reportedUserId, discussionId, answerId, commentId },
  });
}
