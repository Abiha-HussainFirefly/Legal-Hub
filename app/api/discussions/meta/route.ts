// app/api/discussions/meta/route.ts
import { LAWYER_PERMISSION_KEYS } from '@/lib/auth/roles';
import { getSessionUser, userHasLawyerPermission } from '@/lib/services/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getRegions, getTags } from '@/lib/services/discussion.service';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.DISCUSSIONS_VIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [categories, regions, tags] = await Promise.all([getCategories(), getRegions(), getTags()]);
    return NextResponse.json({ categories, regions, tags });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load discussion metadata.' },
      { status: 500 },
    );
  }
}
