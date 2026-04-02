import { NextRequest, NextResponse } from "next/server";
import { verifyEmailCommand } from "@/lib/actions/auth";
import { applyGlobalLimit, applyCustomLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown_ip";
  const userAgent = req.headers.get("user-agent") ?? null;

  // 1. Apply Global Rate Limit (10 req/min/IP)
  const globalLimit = applyGlobalLimit(ip);
  if (!globalLimit.success) {
    return NextResponse.json({ error: "RATE_LIMIT", message: globalLimit.message }, { status: globalLimit.status });
  }

  // 2. Apply Verification Specific Limit (10 per hour)
  const verifyLimit = applyCustomLimit(`verify_email_${ip}`, 10, 60 * 60 * 1000, "Too many verification attempts. Please try again later.");
  if (!verifyLimit.success) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS", message: verifyLimit.message }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Email and code are required." },
        { status: 400 }
      );
    }

    const result = await verifyEmailCommand({ email, code, ip, userAgent });

    if (!result.success) {
      return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
    }

    const response = NextResponse.json({
      success: true,
      message: result.message,
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
    console.error("[api/auth/verify-email]", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
