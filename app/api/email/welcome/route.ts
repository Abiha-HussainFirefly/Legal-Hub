import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/auth/email";
import { applyRateLimit } from "@/lib/auth/rate-limit";

/**
 * API: Welcome / Resend Verification Code
 * 
 * Securely resends the 6-digit code if the session is still valid.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown_ip";

  // 1. Industry Standard: Rate Limiting
  // Max 3 resend attempts per hour per IP
  const rateLimitResult = applyRateLimit(`resend_code_${ip}`, 3, 60 * 60 * 1000);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS", message: "Too many resend attempts. Please try again later." }, { status: 429 });
  }

  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();

    // Find the latest active verification code //
    const token = await prisma.verificationToken.findFirst({
      where: {
        identifierValue: normalizedEmail,
        purpose: "email_verify",
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (token) {
      // Background Job Processing Strategy: 
      // Do not await the email sending. Let it process in the background.
      sendVerificationCode({
        to: normalizedEmail,
        name: name ?? normalizedEmail,
        code: token.token,
      }).catch((err) => console.error("[Background Email Error]", err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/email/welcome]", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
