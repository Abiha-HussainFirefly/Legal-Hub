import { after, NextRequest, NextResponse } from "next/server";
import { registerCommand } from "@/lib/actions/auth";
import { applyGlobalLimit, applyCustomLimit } from "@/lib/auth/rate-limit";
import { sendVerificationCode } from "@/lib/auth/email";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown_ip";
  const userAgent = req.headers.get("user-agent") ?? null;

  // 1. Apply Global Rate Limit (10 req/min/IP)
  const globalLimit = applyGlobalLimit(ip);
  if (!globalLimit.success) {
    return NextResponse.json({ error: "RATE_LIMIT", message: globalLimit.message }, { status: globalLimit.status });
  }

  // 2. Apply Registration Specific Limit (3 per hour)
  const regLimit = applyCustomLimit(`register_${ip}`, 3, 60 * 60 * 1000, "Too many registration attempts. Please try again later.");
  if (!regLimit.success) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS", message: regLimit.message, step: "server" }, { status: 429 });
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

    if (result.data?.verificationEmail) {
      after(async () => {
        await sendVerificationCode(result.data!.verificationEmail!).catch((error) => {
          console.error("[api/auth/register] verification email failed", error);
        });
      });
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
