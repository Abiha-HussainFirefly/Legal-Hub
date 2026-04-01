import { sendVerificationEmail } from '@/lib/auth/email';
import { hashPassword }          from '@/lib/auth/password';
import { generateToken }         from '@/lib/auth/token';
import { prisma }                from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

const IdentifierType = { EMAIL: 'EMAIL' }       as const;
const UserType       = { EXTERNAL: 'EXTERNAL' } as const;
const UserStatus     = { ACTIVE: 'ACTIVE' }     as const;
const AuditAction    = { USER_CREATED: 'USER_CREATED', ROLE_ASSIGNED: 'ROLE_ASSIGNED' } as const;

export async function POST(req: NextRequest) {
  const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  try {
    const body = await req.json();
    const { name, email, password, barCouncilNo, jurisdiction, expertise } = body;

    //Validate
    if (!name || !email || !password || !barCouncilNo || !jurisdiction || !expertise) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'All fields are required.', step: 'validation' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.', step: 'validation' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.userIdentifier.findUnique({
      where: { type_value: { type: IdentifierType.EMAIL, value: normalizedEmail } },
    });

    if (existing) {
      await prisma.auditLog.create({
        data: { action: AuditAction.USER_CREATED, actorId: null, targetUserId: null, ip, userAgent,
          meta: { status: 'FAILED', reason: 'EMAIL_ALREADY_IN_USE', email: normalizedEmail } },
      });
      return NextResponse.json(
        { error: 'EMAIL_ALREADY_IN_USE', message: 'This email is already registered. Please sign in or use a different email.', step: 'duplicate_check' },
        { status: 409 }
      );
    }

    // Hash password
    const { hash, algo } = await hashPassword(password);

    const { newUser, lawyerRole } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { userType: UserType.EXTERNAL, status: UserStatus.ACTIVE, displayName: name.trim(), locale: 'en' },
      });
      await tx.userIdentifier.create({
        data: { userId: newUser.id, type: IdentifierType.EMAIL, value: normalizedEmail, isPrimary: true, verifiedAt: null },
      });
      await tx.credential.create({
        data: { userId: newUser.id, passwordHash: hash, passwordAlgo: algo },
      });
      const lawyerRole = await tx.role.upsert({
        where:  { name: 'lawyer' },
        update: {},
        create: { name: 'lawyer', description: 'Verified legal professional on Legal Hub', isSystem: false },
      });
      await tx.userRole.create({
        data: { userId: newUser.id, roleId: lawyerRole.id, assignedBy: null },
      });
      await tx.auditLog.create({
        data: { action: AuditAction.ROLE_ASSIGNED, actorId: newUser.id, targetUserId: newUser.id, ip, userAgent,
          meta: { role: 'lawyer', roleId: lawyerRole.id, method: 'self_registration' } },
      });
      return { newUser, lawyerRole };
    });

    //  Verification token
    const rawToken  = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.verificationToken.create({
      data: { userId: newUser.id, purpose: 'email_verify', token: rawToken, expiresAt, identifierType: IdentifierType.EMAIL, identifierValue: normalizedEmail },
    });

    await sendVerificationEmail({ to: normalizedEmail, name: newUser.displayName ?? name, token: rawToken });

    // Audit: USER_CREATED success
    await prisma.auditLog.create({
      data: { action: AuditAction.USER_CREATED, actorId: newUser.id, targetUserId: newUser.id, ip, userAgent,
        meta: { status: 'SUCCESS', email: normalizedEmail, role: 'lawyer', roleId: lawyerRole.id, barCouncilNo, jurisdiction, expertise } },
    });

    // Return full user info
    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your inbox to verify your email.',
      step: 'complete',
      user: {
        id:        newUser.id,
        name:      newUser.displayName,
        email:     normalizedEmail,
        role:      'lawyer',
        roleId:    lawyerRole.id,
        status:    'ACTIVE',
        verified:  false,
        createdAt: newUser.createdAt,
      },
    }, { status: 201 });

  } catch (err) {
    console.error('[register]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong during registration. Please try again.', step: 'server' },
      { status: 500 }
    );
  }
}
