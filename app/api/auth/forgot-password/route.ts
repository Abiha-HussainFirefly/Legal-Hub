import { NextRequest, NextResponse } from 'next/server';
import { prisma }          from '@/lib/prisma';
import { generateToken }   from '@/lib/auth/token';
import { sendPasswordResetEmail } from '@/lib/auth/email';

const AuditAction = {
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
} as const;

const GENERIC_RESPONSE = {
  success: true,
  message: 'If an account with that email exists, a password reset link has been sent.',
};

export async function POST(req: NextRequest) {
  const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Email is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_value: {
          type:  'EMAIL',
          value: normalizedEmail,
        },
      },
      include: {
  user: {
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  },
},
    });

    if (!identifier) {
      await prisma.auditLog.create({
        data: {
          action:       AuditAction.PASSWORD_RESET_REQUESTED,
          actorId:      null,
          targetUserId: null,
          ip,
          userAgent,
          meta: {
            status: 'FAILED',
            reason: 'IDENTIFIER_NOT_FOUND',
            email:  normalizedEmail,
          },
        },
      });

      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const { user } = identifier;

    if (user.status !== 'ACTIVE') {
      await prisma.auditLog.create({
        data: {
          action:       AuditAction.PASSWORD_RESET_REQUESTED,
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: {
            status: 'FAILED',
            reason: `USER_STATUS_${user.status}`,
            email:  normalizedEmail,
          },
        },
      });

      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    // Invalidate any existing unused password_reset tokens //
    await prisma.verificationToken.updateMany({
      where: {
        userId:     user.id,
        purpose:    'password_reset',
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });

    const rawToken  = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); //1 hour

    await prisma.verificationToken.create({
      data: {
        userId:          user.id,
        purpose:         'password_reset',
        token:           rawToken,
        expiresAt,
        identifierType:  'EMAIL',
        identifierValue: normalizedEmail,
      },
    });
const portal =
  body.portal ??
  (user.userType?.toUpperCase().includes('ADMIN') ? 'admin' : 'lawyer');

    //  Send reset email with token link//
    await sendPasswordResetEmail({
      to:    normalizedEmail,
      name:  user.displayName ?? normalizedEmail,
      token: rawToken,
      portal: portal.toLowerCase(),
    });

    // Audit: PASSWORD_RESET_REQUESTED //
    await prisma.auditLog.create({
      data: {
        action:       AuditAction.PASSWORD_RESET_REQUESTED,
        actorId:      user.id,
        targetUserId: user.id,
        ip,
        userAgent,
        meta: {
          status:   'SUCCESS',
          email:    normalizedEmail,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });

  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}