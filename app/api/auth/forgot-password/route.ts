import { NextRequest, NextResponse } from "next/server";
import { requestPasswordResetCommand } from "@/lib/actions/auth";
import { applyGlobalLimit } from "@/lib/auth/rate-limit";

/**
 * API Route: Forgot Password
 */
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
    const { email, portal } = body;

    if (!email) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Email is required." },
        { status: 400 }
      );
    }

    // Execute the business logic command //
    const result = await requestPasswordResetCommand({
      email,
      portal,
      ip,
      userAgent,
    });

    // Use the status code from the result (default to 200 if not provided)
    const status = result.status || (result.success ? 200 : 400);

    return NextResponse.json(result, { status });
  } catch (err) {
    console.error("[api/auth/forgot-password] Request failed:", err);
    
    return NextResponse.json(
      { 
        error: "INTERNAL_ERROR", 
        message: "Something went wrong. Please try again later." 
      },
      { status: 500 }
    );
  }
}
