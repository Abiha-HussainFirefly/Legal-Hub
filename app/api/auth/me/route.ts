import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserQuery } from "@/lib/actions/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const result = await getCurrentUserQuery(token, ip, userAgent);

  if (!result.authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json(result);
}
