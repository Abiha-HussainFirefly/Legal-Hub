import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/prisma';
import { createSession }             from '@/lib/auth/session';

const AuditAction = {
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  USER_CREATED:   'USER_CREATED',
} as const;



export async function GET(req: NextRequest) {
  const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  try {
    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get('token');

    if (!rawToken) {
      return NextResponse.json(
        { error: 'MISSING_TOKEN', message: 'Verification token is required.' },
        { status: 400 }
      );
    }

   
    const record = await prisma.verificationToken.findFirst({
      where: {
        token:   rawToken,
        purpose: 'email_verify',
      },
    });

    const isInvalid  = !record;
    const isExpired  = record && record.expiresAt < new Date();
    const isConsumed = record && record.consumedAt !== null;

    if (isInvalid || isExpired || isConsumed) {
      if (record?.userId) {
        await prisma.auditLog.create({
          data: {
            action:       AuditAction.EMAIL_VERIFIED,
            actorId:      record.userId,
            targetUserId: record.userId,
            ip,
            userAgent,
            meta: {
              status: 'FAILED',
              reason: isExpired  ? 'TOKEN_EXPIRED'  :
                      isConsumed ? 'TOKEN_CONSUMED'  :
                                   'TOKEN_NOT_FOUND',
            },
          },
        });
      }

      return NextResponse.json(
        {
          error:   isExpired  ? 'TOKEN_EXPIRED'  :
                   isConsumed ? 'TOKEN_USED'     :
                                'INVALID_TOKEN',
          message: isExpired  ? 'This link has expired. Please request a new one.' :
                   isConsumed ? 'This link has already been used.'                 :
                                'Invalid verification token.',
        },
        { status: isExpired ? 410 : 400 }
      );
    }

    const { session } = await prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: record.id },
        data:  { consumedAt: new Date() },
      });

      
      let identifierUpdated = false;

      if (record.identifierType && record.identifierValue) {
        
        const identifier = await tx.userIdentifier.findUnique({
          where: {
            type_value: {
              type:  record.identifierType,
              value: record.identifierValue,
            },
          },
        });

        if (identifier) {
          await tx.userIdentifier.update({
            where: { id: identifier.id },
            data:  { verifiedAt: new Date() },
          });
          identifierUpdated = true;
        }

      } else if (record.userId) {
        const primaryIdentifier = await tx.userIdentifier.findFirst({
          where: {
            userId:    record.userId,
            isPrimary: true,
            type:      'EMAIL',
          },
        });

        if (primaryIdentifier) {
          await tx.userIdentifier.update({
            where: { id: primaryIdentifier.id },
            data:  { verifiedAt: new Date() },
          });
          identifierUpdated = true;
        }
      }

      if (!identifierUpdated) {
        throw new Error('Could not locate a UserIdentifier to verify.');
      }

      // Audit EMAIL_VERIFIED (success)//
      await tx.auditLog.create({
        data: {
          action:       AuditAction.EMAIL_VERIFIED,
          actorId:      record.userId,
          targetUserId: record.userId,
          ip,
          userAgent,
          meta: { status: 'SUCCESS' },
        },
      });

      const session = await createSession(tx, {
        userId:    record.userId!,
        ip,
        userAgent,
      });

      return { session };
    });

    // Set HttpOnly session cookie //
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully. Welcome to Legal Hub!',
    });

    response.cookies.set('session_token', session.sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      expires:  session.expiresAt,
    });

    return response;

  } catch (err) {
    console.error('[verify-email]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
