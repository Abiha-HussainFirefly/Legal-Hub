// app/api/discussions/route.ts
import { LAWYER_PERMISSION_KEYS } from "@/lib/auth/roles";
import { getSessionUser, userHasLawyerPermission } from "@/lib/services/api-auth";
import {
  createDiscussion,
  finalizeDiscussionCreation,
  listDiscussions,
} from "@/lib/services/discussion.service";
import type { DiscussionFilters, DiscussionStatus, DiscussionType } from "@/types/discussion";
import { NextRequest, NextResponse, after } from "next/server";

const DISCUSSION_TYPES: DiscussionType[] = ["QUESTION", "DISCUSSION", "ANNOUNCEMENT", "LEGAL_UPDATE"];
const DISCUSSION_STATUSES: DiscussionStatus[] = ["OPEN", "RESOLVED", "CLOSED", "LOCKED", "HIDDEN", "DELETED"];
const DISCUSSION_SORTS: NonNullable<DiscussionFilters["sort"]>[] = ["latest", "popular", "unanswered", "trending"];

function parseEnumValue<T extends string>(value: string | null, allowedValues: readonly T[]) {
  return value && allowedValues.includes(value as T) ? (value as T) : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.DISCUSSIONS_VIEW)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = new URL(req.url).searchParams;

    const filters: DiscussionFilters = {
      kind: parseEnumValue(sp.get("kind"), DISCUSSION_TYPES),
      categoryId: sp.get("categoryId") || undefined,
      regionId: sp.get("regionId") || undefined,
      tagId: sp.get("tagId") || undefined,
      status: parseEnumValue(sp.get("status"), DISCUSSION_STATUSES),
      authorId: sp.get("authorId") || undefined,
      savedByUserId: sp.get("savedByUserId") || undefined,
      search: sp.get("search") || undefined,
      page: Math.max(1, parseInt(sp.get("page") || "1")),
      limit: Math.min(50, parseInt(sp.get("limit") || "20")),
      sort: parseEnumValue(sp.get("sort"), DISCUSSION_SORTS) ?? "latest",
      aiSummaryOnly: sp.get("aiSummaryOnly") === "true",
    };

    const data = await listDiscussions(filters, user?.id);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user?.id || !userHasLawyerPermission(user, LAWYER_PERMISSION_KEYS.DISCUSSIONS_CREATE)) {
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

    after(async () => {
      await finalizeDiscussionCreation(result.id, user.id).catch((error) => {
        console.error("[api/discussions] finalize discussion creation failed", error);
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create discussion" },
      { status: 400 }
    );
  }
}