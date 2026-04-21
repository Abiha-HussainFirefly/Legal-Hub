// app/api/discussions/meta/route.ts
import { NextResponse } from 'next/server';
import { getCategories, getRegions, getTags } from '@/lib/services/discussion.service';
export async function GET() {
  try {
    const [categories, regions, tags] = await Promise.all([getCategories(), getRegions(), getTags()]);
    return NextResponse.json({ categories, regions, tags });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}