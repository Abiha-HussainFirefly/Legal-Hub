import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    const isValid =
      verificationToken &&
      verificationToken.purpose === 'password_reset' &&
      !verificationToken.consumedAt &&
      verificationToken.expiresAt > new Date();

    if (!isValid || !verificationToken.user) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'This reset link is invalid or has expired.' },
        { status: 400 }
      );
    }

    const { user } = verificationToken;
    const { hash, algo } = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.credential.update({
        where: { userId: user.id },
        data: {
          passwordHash: hash,
          passwordAlgo: algo,
          passwordSetAt: new Date(),
          mustRotate: false,
        },
      });

      await tx.verificationToken.update({
        where: { token },
        data: { consumedAt: new Date() },
      });

      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'PASSWORD_RESET' },
      });

      await tx.auditLog.create({
        data: {
          action:       'PASSWORD_RESET_COMPLETED',
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: {
            status: 'SUCCESS',
            email:  verificationToken.identifierValue,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });

  } catch (err) {
    console.error('[reset-password]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}