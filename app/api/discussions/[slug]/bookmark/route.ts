import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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

    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    const existing = await prisma.savedDiscussion.findUnique({
      where: {
        discussionId_userId: {
          discussionId: discussion.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      // Un-bookmark
      await prisma.$transaction([
        prisma.savedDiscussion.delete({ where: { id: existing.id } }),
        prisma.discussion.update({
          where: { id: discussion.id },
          data: { bookmarkCount: { decrement: 1 } },
        }),
        prisma.userStats.upsert({
          where: { userId: session.user.id },
          create: { userId: session.user.id, bookmarkCount: 0 },
          update: { bookmarkCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ saved: false });
    } else {
      // Bookmark
      await prisma.$transaction([
        prisma.savedDiscussion.create({
          data: { discussionId: discussion.id, userId: session.user.id },
        }),
        prisma.discussion.update({
          where: { id: discussion.id },
          data: { bookmarkCount: { increment: 1 } },
        }),
        prisma.userStats.upsert({
          where: { userId: session.user.id },
          create: { userId: session.user.id, bookmarkCount: 1 },
          update: { bookmarkCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('[POST /api/discussions/[slug]/bookmark]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
