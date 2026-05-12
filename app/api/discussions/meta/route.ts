// app/api/discussions/meta/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getRegions, getTags } from '@/lib/services/discussion.service';

export async function GET(req: NextRequest) {
  try {
    void req;
    const [categories, regions, tags] = await Promise.all([getCategories(), getRegions(), getTags()]);
    return NextResponse.json({ categories, regions, tags });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load discussion metadata.' },
      { status: 500 },
    );
  }
}
