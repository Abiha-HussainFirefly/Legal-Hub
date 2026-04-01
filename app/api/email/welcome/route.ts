import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/prisma';
import { sendVerificationEmail }     from '@/lib/auth/email';


export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: 'MISSING_EMAIL' }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();

    const token = await prisma.verificationToken.findFirst({
      where: {
        identifierValue: normalizedEmail,
        purpose:         'email_verify',
        consumedAt:      null,
        expiresAt:       { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (token) {
      await sendVerificationEmail({
        to:    normalizedEmail,
        name:  name ?? normalizedEmail,
        token: token.token,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[welcome]', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
