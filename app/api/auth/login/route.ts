import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
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

    const identifier = await prisma.userIdentifier.findUnique({
      where: {
        type_value: {
          type: 'EMAIL',
          value: normalizedEmail,
        },
      },
      include: {
        user: {
          include: { 
            credential: true,
            roles: {
              include: {
                role: true
              }
            }
          },
        },
      },
    });

    if (!identifier || !identifier.user) {
      return NextResponse.json(
        { error: 'LOGIN_FAILED', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const { user } = identifier;

    // Status Check (ACTIVE/SUSPENDED/DISABLED)
    if (user.status !== 'ACTIVE') {
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { reason: user.status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_DISABLED' },
        },
      });

      return NextResponse.json(
        {
          error: user.status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_DISABLED',
          message: user.status === 'SUSPENDED'
            ? 'Your account has been suspended. Please contact support.'
            : 'Your account has been disabled.',
        },
        { status: 403 }
      );
    }

    // Credential Check
    if (!user.credential) {
      return NextResponse.json(
        { error: 'OAUTH_ONLY', message: 'This account uses social login. Please sign in with Google or Facebook.' },
        { status: 401 }
      );
    }

    // Password Verification
    const passwordValid = await verifyPassword(password, user.credential.passwordHash);
    if (!passwordValid) {
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { reason: 'INVALID_PASSWORD' },
        },
      });

      return NextResponse.json(
        { error: 'LOGIN_FAILED', message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

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

    const userRole = loginType || (assignedRoles.length > 0 ? assignedRoles[0] : 'USER');

    // Session Creation & Audit Log
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await createSession(tx, { userId: user.id, ip, userAgent });

      await tx.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ip,
          lastUserAgent: userAgent,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'LOGIN_SUCCESS',
          actorId: user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: { email: normalizedEmail, role: userRole, portal: loginType },
        },
      });

      return newSession;
    });

    // Final Response with Cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        displayName: user.displayName || normalizedEmail,
        email: normalizedEmail,
        role: userRole, 
      },
    });

    response.cookies.set('session_token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
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