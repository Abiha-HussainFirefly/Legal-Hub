import { NextRequest, NextResponse } from "next/server";
import { logoutCommand } from "@/lib/actions/auth";
import { SESSION_COOKIE_NAMES, readSessionToken } from "@/lib/auth/session-cookie";

export async function POST(req: NextRequest) {
  const token = readSessionToken(req);
  await logoutCommand(token);

  const res = NextResponse.json({ success: true, message: "Logged out successfully." });

  for (const name of SESSION_COOKIE_NAMES) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
  }

  return res;
}
