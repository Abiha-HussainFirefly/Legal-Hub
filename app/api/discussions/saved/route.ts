// app/api/discussions/saved/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { prisma } from '@/lib/prisma';

const AUTHOR_SELECT = {
  id: true, displayName: true, avatarUrl: true,
  profile:       { select: { username: true, isLawyer: true } },
  lawyerProfile: { select: { verificationStatus: true, barCouncil: true, firmName: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp    = new URL(req.url).searchParams;
    const page  = Math.max(1,  parseInt(sp.get('page')  || '1'));
    const limit = Math.min(50, parseInt(sp.get('limit') || '20'));
    const skip  = (page - 1) * limit;

    const [total, saved] = await prisma.$transaction([
      prisma.savedDiscussion.count({ where: { userId: user.id } }),
      prisma.savedDiscussion.findMany({
        where:   { userId: user.id },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          discussion: {
            include: {
              author:   { select: AUTHOR_SELECT },
              category: { select: { id: true, name: true, slug: true, colorHex: true } },
              region:   { select: { id: true, name: true, slug: true } },
              tags:     { include: { tag: { select: { id: true, name: true, slug: true } } } },
            },
          },
        },
      }),
    ]);

    // Return discussions directly (unwrap from SavedDiscussion wrapper)
    const discussions = saved
      .map(s => s.discussion)
      .filter(Boolean)
      .filter(d => d.contentStatus === 'ACTIVE');

    return NextResponse.json({
      data: discussions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}