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

    const existing = await prisma.discussionFollow.findUnique({
      where: {
        discussionId_userId: {
          discussionId: discussion.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      // Unfollow
      await prisma.$transaction([
        prisma.discussionFollow.delete({ where: { id: existing.id } }),
        prisma.discussion.update({
          where: { id: discussion.id },
          data: { followerCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await prisma.$transaction([
        prisma.discussionFollow.create({
          data: { discussionId: discussion.id, userId: session.user.id },
        }),
        prisma.discussion.update({
          where: { id: discussion.id },
          data: { followerCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('[POST /api/discussions/[slug]/follow]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
