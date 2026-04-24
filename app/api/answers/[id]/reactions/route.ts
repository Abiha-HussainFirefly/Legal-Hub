// app/api/answers/[id]/reactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { reactToAnswer } from '@/lib/services/discussion.service';
type P = { params: Promise<{ id: string }> };
export async function POST(req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const user   = await getSessionUser(req);
    if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { reactionType } = await req.json();
    if (!reactionType) return NextResponse.json({ error: 'reactionType required' }, { status: 400 });
    await reactToAnswer(user.id, id, { reactionType });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}