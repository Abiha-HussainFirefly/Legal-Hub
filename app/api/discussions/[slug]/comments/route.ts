// app/api/discussions/[slug]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { prisma } from '@/lib/prisma';
import { AUTHOR_SELECT, createComment } from '@/lib/services/discussion.service';
type P = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: P) {
  try {
    const { slug } = await params;
    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!discussion) return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    const discussionId = discussion.id;
    const sp=new URL(req.url).searchParams, page=Math.max(1,parseInt(sp.get('page')||'1')), limit=Math.min(50,parseInt(sp.get('limit')||'20')), skip=(page-1)*limit;
    const [total,data]=await prisma.$transaction([
      prisma.comment.count({where:{discussionId,parentId:null,status:'ACTIVE',answerId:null}}),
      prisma.comment.findMany({where:{discussionId,parentId:null,status:'ACTIVE',answerId:null},skip,take:limit,orderBy:{createdAt:'asc'},
        include:{author:{select:AUTHOR_SELECT},replies:{where:{status:'ACTIVE'},take:5,orderBy:{createdAt:'asc'},include:{author:{select:AUTHOR_SELECT}}}}}),
    ]);
    return NextResponse.json({data,meta:{total,page,limit,totalPages:Math.ceil(total/limit)}});
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
export async function POST(req: NextRequest, { params }: P) {
  try {
    const { slug } = await params;
    const discussion = await prisma.discussion.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!discussion) return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    const discussionId = discussion.id;
    const user=await getSessionUser(req);
    if (!user?.id) return NextResponse.json({error:'Unauthorized'},{status:401});
    const {body,parentId}=await req.json();
    if (!body?.trim()) return NextResponse.json({error:'Body required'},{status:400});
    const created = await createComment(user.id,discussionId,undefined,parentId,{body});
    const fullComment = await prisma.comment.findUnique({
      where: { id: created.id },
      include: {
        author: { select: AUTHOR_SELECT },
        replies: {
          where: { status: 'ACTIVE' },
          take: 5,
          orderBy: { createdAt: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    });
    return NextResponse.json(fullComment ?? created,{status:201});
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create comment';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
