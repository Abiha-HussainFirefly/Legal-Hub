import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type DiscussionWithViewerState = {
  reactions?: { reactionType: string }[];
  followers?: { id: string }[];
  bookmarks?: { id: string }[];
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await params;
    
    // Crucial: Use the ID from the session to fetch user-specific states
    const userId = session?.user?.id;

    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            profile: {
              select: {
                username: true,
                headline: true,
                isLawyer: true,
              },
            },
            lawyerProfile: {
              select: {
                verificationStatus: true,
                barCouncil: true,
              },
            },
          },
        },
        category: {
          select: { id: true, name: true, slug: true, colorHex: true },
        },
        region: {
          select: { id: true, name: true, type: true },
        },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        acceptedAnswer: {
          select: { id: true },
        },
        comments: {
          where: { status: 'ACTIVE', parentId: null, answerId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                profile: {
                  select: {
                    username: true,
                    headline: true,
                    isLawyer: true,
                  },
                },
                lawyerProfile: {
                  select: {
                    verificationStatus: true,
                    barCouncil: true,
                    firmName: true,
                  },
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
                    profile: {
                      select: {
                        username: true,
                        headline: true,
                        isLawyer: true,
                      },
                    },
                    lawyerProfile: {
                      select: {
                        verificationStatus: true,
                        barCouncil: true,
                        firmName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        aiSummaries: {
          where: { isCurrent: true, status: 'GENERATED' },
          orderBy: { version: 'desc' },
          take: 1,
          select: {
            summaryText: true,
            mainIssue: true,
            keyPoints: true,
            expertConsensus: true,
            status: true,
          },
        },
        _count: {
          select: {
            answers: true,
            comments: true,
            reactions: true,
            followers: true,
          },
        },
        // Only attempt to include these if we have a valid userId
        ...(userId ? {
          reactions: {
            where: { userId: userId },
            select: { reactionType: true },
          },
          followers: {
            where: { userId: userId },
            select: { id: true },
          },
          bookmarks: {
            where: { userId: userId },
            select: { id: true },
          },
        } : {}),
      },
    });

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    const isAuthor = userId === discussion.authorId;
    if (
      (discussion.contentStatus === 'DELETED' ||
        discussion.contentStatus === 'REMOVED') &&
      !isAuthor
    ) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    // View Tracking
    prisma.discussionView
      .create({
        data: {
          discussionId: discussion.id,
          userId: userId ?? null,
        },
      })
      .then(() =>
        prisma.discussion.update({
          where: { id: discussion.id },
          data: { viewCount: { increment: 1 } },
        })
      )
      .catch(() => {});

    const tags = discussion.tags.map((dt) => dt.tag);
    
    // Explicitly casting to access the conditional relations
    const typedDisc = discussion as any;
    const viewerReaction = typedDisc.reactions?.[0]?.reactionType ?? null;
    const viewerFollowing = (typedDisc.followers?.length ?? 0) > 0;
    const viewerSaved = (typedDisc.bookmarks?.length ?? 0) > 0;

    // Remove the relation arrays before sending to frontend to keep payload clean
    const { reactions, followers, bookmarks, ...cleanDiscussion } = typedDisc;

    return NextResponse.json({
      discussion: {
        ...cleanDiscussion,
        tags,
        viewerReaction,
        viewerFollowing,
        viewerSaved,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    console.error('[GET /api/discussions/[slug]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const body = await req.json();

    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true, authorId: true, body: true, title: true },
    });

    if (!discussion) return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    if (discussion.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const allowedFields = ['title', 'body', 'categoryId', 'regionId', 'visibility'];
    const updateData: Record<string, any> = {};
    allowedFields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f]; });

    const currentVersion = await prisma.discussionRevision.count({ where: { discussionId: discussion.id } });

    await prisma.$transaction([
      prisma.discussionRevision.create({
        data: {
          discussionId: discussion.id,
          version: currentVersion + 1,
          editorId: session.user.id,
          snapshot: { title: discussion.title, body: discussion.body },
          changeSummary: body.changeSummary ?? null,
        },
      }),
      prisma.discussion.update({
        where: { id: discussion.id },
        data: { ...updateData, updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true, authorId: true },
    });

    if (!discussion) return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    if (discussion.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.discussion.update({
      where: { id: discussion.id },
      data: { contentStatus: 'DELETED', status: 'DELETED', deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}