import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies, readSessionToken } from "@/lib/auth/session-cookie";
import { getSessionUser } from "@/lib/services/api-auth";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    const response = NextResponse.json(
      { authenticated: false },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
    if (readSessionToken(req)) {
      clearSessionCookies(response);
    }
    return response;
  }

  return NextResponse.json(
    { authenticated: true, user },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
