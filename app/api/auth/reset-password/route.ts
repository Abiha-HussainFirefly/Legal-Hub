import { NextRequest, NextResponse } from "next/server";
import { resetPasswordCommand } from "@/lib/actions/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "MISSING_FIELDS", message: "Token and new password are required." },
        { status: 400 }
      );
    }

    const result = await resetPasswordCommand({ token, newPassword, ip, userAgent });

    if (!result.success) {
      return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("[api/auth/reset-password]", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
