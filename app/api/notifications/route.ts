import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/notifications?limit=15
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '15', 10), 50);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          data: true,
          actor: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          discussion: {
            select: { id: true, slug: true, title: true },
          },
          answer: {
            select: { id: true, discussionId: true },
          },
          comment: {
            select: { id: true },
          },
        },
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  
    let ids: string[] | undefined;
    try {
      const body = await req.json();
      if (Array.isArray(body?.ids)) ids = body.ids;
    } catch {
      // no body — mark all
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
        ...(ids ? { id: { in: ids } } : {}),
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/notifications]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}