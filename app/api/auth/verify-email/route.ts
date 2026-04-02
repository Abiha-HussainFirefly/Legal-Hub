import { NextRequest, NextResponse } from "next/server";
import { verifyEmailCommand } from "@/lib/actions/auth";
import { applyRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown_ip";
  const userAgent = req.headers.get("user-agent") ?? null;

  // 1. Industry Standard: Rate Limiting (Brute Force Protection for Verification Codes)
  // Max 10 verification attempts per hour per IP
  const rateLimitResult = applyRateLimit(`verify_email_${ip}`, 10, 60 * 60 * 1000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "TOO_MANY_REQUESTS", message: "Too many verification attempts. Please try again later." },
      { status: 429 }
    );
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
