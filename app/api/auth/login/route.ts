import { NextRequest, NextResponse } from "next/server";
import { loginCommand } from "@/lib/actions/auth";
import { applyGlobalLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown_ip";
  const userAgent = req.headers.get("user-agent") ?? null;

  // 1. Apply Global Rate Limit (10 req/min/IP)
  const rateLimit = applyGlobalLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "RATE_LIMIT", message: rateLimit.message }, { status: rateLimit.status });
  }

  try {
    const body = await req.json();
    const { email, password, loginType } = body;

    const result = await loginCommand({ email, password, loginType, ip, userAgent });

    if (!result.success) {
      return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.data!.user,
    });

    response.cookies.set("session_token", result.data!.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: result.data!.expiresAt,
    });

    return response;
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 });
  }
}
