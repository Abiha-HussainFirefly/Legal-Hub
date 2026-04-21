// app/api/answers/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { prisma } from '@/lib/prisma';
import { acceptAnswer } from '@/lib/services/discussion.service';
type P = { params: Promise<{ id: string }> };
export async function POST(req: NextRequest, { params }: P) {
  try {
    const { id: answerId } = await params;
    const user = await getSessionUser(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ans = await prisma.answer.findUnique({ where: { id: answerId }, select: { discussionId: true } });
    if (!ans) return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    await acceptAnswer(ans.discussionId, answerId, user.id);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}