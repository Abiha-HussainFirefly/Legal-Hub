import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/auth/email";
import { applyGlobalLimit, applyCustomLimit } from "@/lib/auth/rate-limit";

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * API: Welcome / Resend Verification Code
 * 
 * Securely resends the 6-digit code if the session is still valid.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown_ip";

  // 1. Apply Global Rate Limit (10 req/min/IP)
  const globalLimit = applyGlobalLimit(ip);
  if (!globalLimit.success) {
    return NextResponse.json({ error: "RATE_LIMIT", message: globalLimit.message }, { status: globalLimit.status });
  }

  // 2. Apply Resend Specific Limit (3 per hour)
  const resendLimit = applyCustomLimit(`resend_code_${ip}`, 3, 60 * 60 * 1000, "Too many resend attempts. Please try again later.");
  if (!resendLimit.success) {
    return NextResponse.json({ error: "TOO_MANY_REQUESTS", message: resendLimit.message }, { status: 429 });
  }

  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: "MISSING_EMAIL" }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();
    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_normalizedValue: {
          type: "EMAIL",
          normalizedValue: normalizedEmail,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    if (!identifier?.user) {
      return NextResponse.json(
        { error: "ACCOUNT_NOT_FOUND", message: "No account was found for this email." },
        { status: 404 }
      );
    }

    if (identifier.verifiedAt) {
      return NextResponse.json(
        { error: "ALREADY_VERIFIED", message: "This email is already verified. Please log in." },
        { status: 409 }
      );
    }

    // Find the latest active verification code //
    let token = await prisma.verificationToken.findFirst({
      where: {
        identifierValue: normalizedEmail,
        purpose: "email_verify",
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      token = await prisma.verificationToken.create({
        data: {
          userId: identifier.user.id,
          purpose: "email_verify",
          tokenHash: code,
          expiresAt,
          identifierType: "EMAIL",
          identifierValue: normalizedEmail,
        },
      });
    }

    await sendVerificationCode({
      to: normalizedEmail,
      name: name ?? identifier.user.displayName ?? normalizedEmail,
      code: token.tokenHash,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/email/welcome]", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
