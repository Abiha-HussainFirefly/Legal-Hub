import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/services/api-auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json(
      { authenticated: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(
    { authenticated: true, user },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
