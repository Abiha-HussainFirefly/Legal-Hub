import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ReactionType } from '@prisma/client';

function getScoreValue(reactionType: ReactionType) {
  if (reactionType === 'UPVOTE') return 1;
  if (reactionType === 'DOWNVOTE') return -1;
  return 0;
}

function buildEmojiStats(
  reactions: { emoji: string | null; user: { displayName: string | null } | null }[]
) {
  return reactions.reduce<Record<string, { count: number; reactors: string[] }>>((acc, reaction) => {
    if (!reaction.emoji) return acc;
    const existing = acc[reaction.emoji] ?? { count: 0, reactors: [] };
    existing.count += 1;
    existing.reactors.push(reaction.user?.displayName ?? 'Someone');
    acc[reaction.emoji] = existing;
    return acc;
  }, {});
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;

    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    const reactions = await prisma.discussionReaction.findMany({
      where: { discussionId: discussion.id },
      select: {
        reactionType: true,
        emoji: true,
        userId: true,
        user: { select: { displayName: true } },
      },
    });

    const viewerReaction = reactions.find((reaction) => reaction.userId === session?.user?.id) ?? null;

    return NextResponse.json({
      data: buildEmojiStats(reactions),
      viewerReaction: viewerReaction
        ? {
            reactionType: viewerReaction.reactionType,
            emoji: viewerReaction.emoji,
          }
        : null,
    });
  } catch (error) {
    console.error('[GET /api/discussions/[slug]/reactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();
    const reactionType = body?.reactionType as ReactionType | undefined;
    const emoji = typeof body?.emoji === 'string' ? body.emoji : null;

    if (!reactionType) {
      return NextResponse.json({ error: 'reactionType is required' }, { status: 400 });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true, score: true, reactionCount: true },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    const existing = await prisma.discussionReaction.findUnique({
      where: { discussionId_userId: { discussionId: discussion.id, userId: session.user.id } },
    });

    let action: 'added' | 'updated' | 'removed' = 'updated';
    let nextScore = discussion.score;
    let nextReactionCount = discussion.reactionCount;
    let viewerReaction: { reactionType: ReactionType; emoji: string | null } | null = {
      reactionType,
      emoji,
    };

    await prisma.$transaction(async (tx) => {
      if (existing) {
        const isSameReaction = existing.reactionType === reactionType && existing.emoji === emoji;

        if (isSameReaction) {
          const scoreDelta = -getScoreValue(existing.reactionType);
          await tx.discussionReaction.delete({
            where: { id: existing.id },
          });

          if (scoreDelta !== 0 || nextReactionCount > 0) {
            await tx.discussion.update({
              where: { id: discussion.id },
              data: {
                ...(scoreDelta !== 0 ? { score: { increment: scoreDelta } } : {}),
                reactionCount: { decrement: 1 },
              },
            });
          }

          action = 'removed';
          nextScore += scoreDelta;
          nextReactionCount = Math.max(0, nextReactionCount - 1);
          viewerReaction = null;
          return;
        }

        const scoreDelta = getScoreValue(reactionType) - getScoreValue(existing.reactionType);
        await tx.discussionReaction.update({
          where: { id: existing.id },
          data: { reactionType, emoji },
        });

        if (scoreDelta !== 0) {
          await tx.discussion.update({
            where: { id: discussion.id },
            data: { score: { increment: scoreDelta } },
          });
        }

        action = 'updated';
        nextScore += scoreDelta;
        return;
      }

      const scoreDelta = getScoreValue(reactionType);

      await tx.discussionReaction.create({
        data: {
          discussionId: discussion.id,
          userId: session.user.id,
          reactionType,
          emoji,
        },
      });

      await tx.discussion.update({
        where: { id: discussion.id },
        data: {
          ...(scoreDelta !== 0 ? { score: { increment: scoreDelta } } : {}),
          reactionCount: { increment: 1 },
        },
      });

      action = 'added';
      nextScore += scoreDelta;
      nextReactionCount += 1;
    });

    return NextResponse.json({
      action,
      viewerReaction,
      score: nextScore,
      reactionCount: nextReactionCount,
    });
  } catch (error) {
    console.error('[POST /api/discussions/[slug]/reactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
