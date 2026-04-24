import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { createCaseDraft, listCaseRecords } from '@/lib/services/case-repository.server';
import type { CaseSourceType, CaseVisibility } from '@/types/case';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const params = new URL(req.url).searchParams;
    const authorId = params.get('authorId');
    const reviewQueue = params.get('reviewQueue') === 'true';
    const isAdmin = user?.roles?.some((role) => role.toUpperCase() === 'ADMIN') ?? false;

    const data = await listCaseRecords({
      viewerId: user?.id,
      authorId: authorId === 'me' ? user?.id ?? null : authorId,
      includeViewerDrafts: !authorId,
      statuses: reviewQueue && isAdmin ? ['DRAFT', 'PENDING_REVIEW', 'REJECTED'] : undefined,
      search: params.get('search'),
      category: params.get('category'),
      tag: params.get('tag'),
      region: params.get('region'),
      court: params.get('court'),
      sourceType: params.get('sourceType') as CaseSourceType | null,
      visibility: params.get('visibility') as CaseVisibility | null,
      organizationId: params.get('organization'),
      savedByUserId: params.get('savedBy') === 'me' ? user?.id ?? null : params.get('savedBy'),
      dateRange: params.get('dateRange') as '30d' | '90d' | '1y' | null,
      sort: params.get('sort') as 'relevant' | 'recent' | 'decision_date' | 'views' | 'follows' | 'helpful' | 'cited' | null,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load cases';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const created = await createCaseDraft(user.id, body);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create case draft';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
