import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/prisma';
import { verifyPassword }            from '@/lib/auth/password';
import { createSession }             from '@/lib/auth/session';


export async function POST(req: NextRequest) {
  const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  try {
    const body = await req.json();
    const { email, password, loginType } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // READ UserIdentifier + User + Credential + Roles + ExternalAccount(google)
    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_value: { type: 'EMAIL', value: normalizedEmail },
      },
      include: {
        user: {
          include: {
            credential: true,
            roles: {
              include: { role: true },
            },
            // ✅ correct relation name from schema: User.accounts
            accounts: {
              where:  { provider: 'google' },
              select: { id: true },
            },
          },
        },
      },
    });

    // Email not found — same message as wrong password (security)
    if (!identifier || !identifier.user) {
      await prisma.auditLog.create({
        data: {
          action:       'LOGIN_FAILED',
          actorId:      null,
          targetUserId: null,
          ip,
          userAgent,
          meta: { reason: 'invalid_credentials', email: normalizedEmail },
        },
      });
      return NextResponse.json(
        { error: 'LOGIN_FAILED', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const { user } = identifier;
    const isDeleted  = user.deletedAt !== null;
    const isInactive = user.status !== 'ACTIVE';

    if (isInactive || isDeleted) {
      const reason = user.status === 'SUSPENDED'
        ? 'ACCOUNT_SUSPENDED'
        : isDeleted
          ? 'ACCOUNT_DELETED'
          : 'ACCOUNT_DISABLED';

      await prisma.auditLog.create({
        data: {
          action:       'LOGIN_FAILED',
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { reason, email: normalizedEmail },
        },
      });

      return NextResponse.json(
        {
          error:   reason,
          message: user.status === 'SUSPENDED'
            ? 'Your account has been suspended. Please contact support.'
            : 'Your account has been disabled.',
        },
        { status: 403 }
      );
    }

    // Credential check — per flow diagram:
    // only show Google message when credential=null AND Google account exists
    const hasGoogleAccount = user.accounts.length > 0;

    if (!user.credential && hasGoogleAccount) {
      await prisma.auditLog.create({
        data: {
          action:       'LOGIN_FAILED',
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { reason: 'google_only_account', email: normalizedEmail },
        },
      });
      return NextResponse.json(
        {
          error:   'OAUTH_ONLY',
          message: 'This account was created with Google Auth. Please login with Google Auth.',
        },
        { status: 401 }
      );
    }

    // No credential and no Google account — inconsistent state
    if (!user.credential) {
      await prisma.auditLog.create({
        data: {
          action:       'LOGIN_FAILED',
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { reason: 'invalid_credentials', email: normalizedEmail },
        },
      });
      return NextResponse.json(
        { error: 'LOGIN_FAILED', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Verify password — verifyPassword(plaintext, hash)
    const passwordValid = await verifyPassword(password, user.credential.passwordHash);

    if (!passwordValid) {
      await prisma.auditLog.create({
        data: {
          action:       'LOGIN_FAILED',
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { reason: 'invalid_credentials', email: normalizedEmail },
        },
      });
      return NextResponse.json(
        { error: 'LOGIN_FAILED', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Role check for portal-specific login (admin / lawyer portals)
    const assignedRoles = user.roles.map(r => r.role.name.toUpperCase());

    if (loginType === 'ADMIN' && !assignedRoles.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Access denied. You do not have Administrator privileges.' },
        { status: 403 }
      );
    }

    if (loginType === 'LAWYER' && !assignedRoles.includes('LAWYER')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Access denied. This portal is for verified Lawyers only.' },
        { status: 403 }
      );
    }

    const userRole = loginType || (assignedRoles.length > 0 ? assignedRoles[0] : 'MEMBER');

    // TX — Session + lastLoginAt + AuditLog LOGIN_SUCCESS
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await createSession(tx, { userId: user.id, ip, userAgent });

      await tx.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt:   new Date(),
          lastLoginIp:   ip,
          lastUserAgent: userAgent,
        },
      });

      await tx.auditLog.create({
        data: {
          action:       'LOGIN_SUCCESS',
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: {
            authMethod: 'manual',
            email:      normalizedEmail,
            role:       userRole,
            portal:     loginType ?? null,
            sessionId:  newSession.id,
          },
        },
      });

      return newSession;
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: {
        id:          user.id,
        displayName: user.displayName || normalizedEmail,
        email:       normalizedEmail,
        role:        userRole,
      },
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
    console.error('[LOGIN_ERROR]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
