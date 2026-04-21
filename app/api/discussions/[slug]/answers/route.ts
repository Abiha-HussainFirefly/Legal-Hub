import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

type AnswerWithViewerReaction = {
  reactions?: { reactionType: string }[];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const page  = Math.max(parseInt(searchParams.get('page')  ?? '1',  10), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);
    const sort  = searchParams.get('sort') ?? 'top';

    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true, acceptedAnswerId: true },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    const orderBy =
      sort === 'latest' ? { createdAt: 'desc' as const } :
      sort === 'oldest' ? { createdAt: 'asc'  as const } :
                          { score:     'desc' as const };

    const [answers, total] = await Promise.all([
      prisma.answer.findMany({
        where: {
          discussionId: discussion.id,
          status: { not: 'DELETED' },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              profile: {
                select: { username: true, headline: true, isLawyer: true },
              },
              lawyerProfile: {
                select: { verificationStatus: true },
              },
            },
          },
          comments: {
            where: { status: 'ACTIVE', parentId: null },
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                  lawyerProfile: {
                    select: { verificationStatus: true, barCouncil: true, firmName: true },
                  },
                },
              },
              replies: {
                where: { status: 'ACTIVE' },
                orderBy: { createdAt: 'asc' },
                include: {
                  author: {
                    select: {
                      id: true,
                      displayName: true,
                      avatarUrl: true,
                      lawyerProfile: {
                        select: { verificationStatus: true, barCouncil: true, firmName: true },
                      },
                    },
                  },
                },
              },
            },
          },
          _count: { select: { comments: true, reactions: true } },
          ...(session?.user?.id
            ? {
                reactions: {
                  where: { userId: session.user.id },
                  select: { reactionType: true },
                },
              }
            : {}),
        },
      }),
      prisma.answer.count({
        where: { discussionId: discussion.id, status: { not: 'DELETED' } },
      }),
    ]);

    const shaped = answers.map((a) => {
      const answerWithViewerReaction = a as typeof a & AnswerWithViewerReaction;
      const viewerReaction = answerWithViewerReaction.reactions?.[0]?.reactionType ?? null;
      const rest = {
        ...a,
        reactions: undefined,
      };
      return {
        ...rest,
        isAccepted: a.id === discussion.acceptedAnswerId,
        viewerReaction,
      };
    });

    return NextResponse.json({
      data: shaped,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET /api/discussions/[slug]/answers]', error);
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
    const answerBody: string = body?.body?.trim() ?? '';

    if (!answerBody) {
      return NextResponse.json({ error: 'Answer body is required' }, { status: 400 });
    }

    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true, status: true, authorId: true },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    if (discussion.status === 'LOCKED' || discussion.status === 'CLOSED') {
      return NextResponse.json({ error: 'Discussion is closed' }, { status: 403 });
    }

    const [answer] = await prisma.$transaction([
      prisma.answer.create({
        data: {
          discussionId: discussion.id,
          authorId: session.user.id,
          body: answerBody,
        },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              profile: { select: { username: true, isLawyer: true } },
            },
          },
        },
      }),
      prisma.discussion.update({
        where: { id: discussion.id },
        data: {
          answerCount: { increment: 1 },
          lastActivityAt: new Date(),
        },
      }),
      prisma.userStats.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, answerCount: 1 },
        update: { answerCount: { increment: 1 } },
      }),
    ]);

    // Notify discussion author (fire-and-forget)
    if (discussion.authorId !== session.user.id) {
      prisma.notification
        .create({
          data: {
            userId: discussion.authorId,
            actorId: session.user.id,
            type: 'NEW_ANSWER',
            title: 'New answer on your discussion',
            discussionId: discussion.id,
            answerId: answer.id,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/discussions/[slug]/answers]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
