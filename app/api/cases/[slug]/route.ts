import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/services/api-auth';
import { findCaseRecordBySlug } from '@/lib/services/case-repository.server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getSessionUser(req);
    const { slug } = await params;
    const record = await findCaseRecordBySlug(slug, user?.id);
    const isAdmin = user?.roles?.some((role) => role.toUpperCase() === 'ADMIN') ?? false;

    if (!record) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (record.status !== 'PUBLISHED' && record.author.id !== user?.id && !isAdmin) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load case';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
