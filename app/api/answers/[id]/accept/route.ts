// app/api/answers/[id]/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LAWYER_PERMISSION_KEYS } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/services/api-auth';
import { userHasLawyerPermission } from '@/lib/services/api-auth';
import { prisma } from '@/lib/prisma';
import { acceptAnswer } from '@/lib/services/discussion.service';
type P = { params: Promise<{ id: string }> };
export async function POST(req: NextRequest, { params }: P) {
  try {
    const { id: answerId } = await params;
    const user = await getSessionUser(req);
    if (!user?.id || !userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.ANSWERS_ACCEPT_ON_OWN_DISCUSSION)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ans = await prisma.answer.findUnique({ where: { id: answerId }, select: { discussionId: true } });
    if (!ans) return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    await acceptAnswer(ans.discussionId, answerId, user.id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to accept answer.' }, { status: 400 });
  }
}
