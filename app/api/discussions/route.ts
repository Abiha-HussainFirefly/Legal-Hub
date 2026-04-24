// app/api/discussions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/services/api-auth";
import {
  listDiscussions,
  createDiscussion,
} from "@/lib/services/discussion.service";
import type { DiscussionFilters } from "@/types/discussion";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    const sp = new URL(req.url).searchParams;

    const filters: DiscussionFilters = {
      kind: (sp.get("kind") as any) || undefined,
      categoryId: sp.get("categoryId") || undefined,
      regionId: sp.get("regionId") || undefined,
      tagId: sp.get("tagId") || undefined,
      status: (sp.get("status") as any) || undefined,
      authorId: sp.get("authorId") || undefined,
      savedByUserId: sp.get("savedByUserId") || undefined,
      search: sp.get("search") || undefined,
      page: Math.max(1, parseInt(sp.get("page") || "1")),
      limit: Math.min(50, parseInt(sp.get("limit") || "20")),
      sort: (sp.get("sort") as any) || "latest",
      aiSummaryOnly: sp.get("aiSummaryOnly") === "true",
    };

    const data = await listDiscussions(filters, user?.id);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.title?.trim())
      return NextResponse.json({ error: "Title required" }, { status: 400 });

    if (!body.body?.trim())
      return NextResponse.json({ error: "Body required" }, { status: 400 });

    if (!body.categoryId)
      return NextResponse.json(
        { error: "Category required" },
        { status: 400 }
      );

    if (!body.kind)
      return NextResponse.json({ error: "Kind required" }, { status: 400 });

    const result = await createDiscussion(user.id, body);

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to create discussion" },
      { status: 400 }
    );
  }
}
