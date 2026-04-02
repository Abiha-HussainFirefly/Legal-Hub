import { NextRequest, NextResponse } from "next/server";
import { logoutCommand } from "@/lib/actions/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  await logoutCommand(token);

  const res = NextResponse.json({ success: true, message: "Logged out successfully." });

  res.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return res;
}
