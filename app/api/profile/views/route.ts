import { auth } from "@/auth";
import { recordProfileView } from "@/lib/services/profile.server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  const body = await request.json().catch(() => null);

  if (!body?.profileUserId || typeof body.profileUserId !== "string") {
    return NextResponse.json({ error: "profileUserId is required" }, { status: 400 });
  }

  await recordProfileView(
    body.profileUserId,
    {
      id: session?.user?.id ?? null,
      roles: (session?.user as { roles?: string[] } | undefined)?.roles ?? [],
    },
    {
      ipHash:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        null,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    },
  );

  return NextResponse.json({ success: true });
}
