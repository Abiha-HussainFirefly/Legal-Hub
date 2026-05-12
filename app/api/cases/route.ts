import { NextRequest, NextResponse } from 'next/server';
import { LAWYER_PERMISSION_KEYS } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/services/api-auth';
import { userHasLawyerPermission } from '@/lib/services/api-auth';
import { createCaseDraft, listCaseRecords } from '@/lib/services/case-repository.server';
import type { CaseSourceType, CaseVisibility } from '@/types/case';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const params = new URL(req.url).searchParams;
    const authorId = params.get('authorId');
    const reviewQueue = params.get('reviewQueue') === 'true';
    const isAdmin = user?.roles?.some((role) => role.toUpperCase() === 'ADMIN') ?? false;
    const isOwnCasesRequest = authorId === 'me';
    const isSavedCasesRequest = params.get('savedBy') === 'me';

    if (isOwnCasesRequest) {
      if (!userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.CASES_VIEW_OWN_DASHBOARD)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (isSavedCasesRequest) {
      if (!userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.CASES_VIEW_SAVED_OWN)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (reviewQueue && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    if (!user?.id || !userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.CASES_CREATE_DRAFT)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (body?.intent === 'submit' && !userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.CASES_SUBMIT_OWN_FOR_REVIEW)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const created = await createCaseDraft(user.id, body);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create case draft';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
