import { NextRequest, NextResponse } from "next/server";
import { registerCommand } from "@/lib/actions/auth";
import { applyRateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown_ip";
  const userAgent = req.headers.get("user-agent") ?? null;

  // 1. Industry Standard: Rate Limiting (Spam/Bot Protection)
  // Max 3 registrations per hour per IP
  const rateLimitResult = applyRateLimit(`register_${ip}`, 3, 60 * 60 * 1000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "TOO_MANY_REQUESTS", message: "Too many registration attempts. Please try again later.", step: "server" },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, password, barCouncilNo, jurisdiction, expertise } = body;

    if (!name || !email || !password || !barCouncilNo || !jurisdiction || !expertise) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "All fields are required.", step: "validation" },
        { status: 400 }
      );
    }

    const result = await registerCommand({ name, email, password, barCouncilNo, jurisdiction, expertise, ip, userAgent });

    if (!result.success) {
      return NextResponse.json({ error: result.error, message: result.message, step: "duplicate_check" }, { status: result.status });
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        step: "complete",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/auth/register]", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong during registration. Please try again.", step: "server" },
      { status: 500 }
    );
  }
}
