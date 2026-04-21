import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { getCaseRepositoryMeta } from '@/lib/services/case-repository.server';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const data = await getCaseRepositoryMeta(user?.id);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load case metadata';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
