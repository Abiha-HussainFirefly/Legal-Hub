import { NextRequest, NextResponse } from "next/server";
import { logoutCommand } from "@/lib/actions/auth";
import { clearSessionCookies, readSessionToken } from "@/lib/auth/session-cookie";

export async function POST(req: NextRequest) {
  const token = readSessionToken(req);
  await logoutCommand(token);

  const res = NextResponse.json({ success: true, message: "Logged out successfully." });
  clearSessionCookies(res);

  return res;
}
