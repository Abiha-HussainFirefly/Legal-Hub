import { NextRequest, NextResponse }  from 'next/server';
import { prisma }                      from '@/lib/prisma';
import { hashPassword }                from '@/lib/auth/password';
import { generateToken }               from '@/lib/auth/token';
import { sendVerificationEmail }       from '@/lib/auth/email';


export async function POST(req: NextRequest) {
  const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  try {
    const body = await req.json();
    const { name, email, password, barCouncilNo, jurisdiction, expertise } = body;

    
    if (!name || !email || !password || !barCouncilNo || !jurisdiction || !expertise) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'All fields are required.', step: 'validation' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.', step: 'validation' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.userIdentifier.findUnique({
      where: { type_value: { type: 'EMAIL', value: normalizedEmail } },
      include: {
        user: {
          include: {
            credential: true,
            roles:      { include: { role: true } },
            accounts:   { where: { provider: 'google' }, take: 1 },
          },
        },
      },
    });

    if (existing && existing.user) {
      const roles        = existing.user.roles.map(r => r.role.name);
      const hasCredential = existing.user.credential !== null;
      const hasGoogle     = existing.user.accounts.length > 0;
      const isAdmin       = roles.includes('admin');

      // Admin email — public signup always blocked
      if (isAdmin) {
        await prisma.auditLog.create({
          data: {
            action: 'USER_CREATED', actorId: null, targetUserId: null,
            ip, userAgent,
            meta: { status: 'FAILED', reason: 'ADMIN_EMAIL_CONFLICT', email: normalizedEmail },
          },
        });
        return NextResponse.json(
          { error: 'ADMIN_EMAIL_CONFLICT', message: 'This email cannot be used for public registration.', step: 'duplicate_check' },
          { status: 409 }
        );
      }

      // Google-only account — no password credential
      if (!hasCredential && hasGoogle) {
        await prisma.auditLog.create({
          data: {
            action: 'USER_CREATED', actorId: null, targetUserId: null,
            ip, userAgent,
            meta: { status: 'FAILED', reason: 'GOOGLE_ONLY_ACCOUNT', email: normalizedEmail },
          },
        });
        return NextResponse.json(
          { error: 'GOOGLE_ONLY_ACCOUNT', message: 'This account already exists with Google Auth. Please continue with Google Auth.', step: 'duplicate_check' },
          { status: 409 }
        );
      }

      // Manual or hybrid account already exists
      await prisma.auditLog.create({
        data: {
          action: 'USER_CREATED', actorId: null, targetUserId: null,
          ip, userAgent,
          meta: { status: 'FAILED', reason: 'EMAIL_ALREADY_IN_USE', email: normalizedEmail },
        },
      });
      return NextResponse.json(
        { error: 'EMAIL_ALREADY_IN_USE', message: 'This email is already registered. Please sign in or use a different email.', step: 'duplicate_check' },
        { status: 409 }
      );
    }

    // ── Hash password before entering the transaction ─────────────────────────
    const { hash, algo } = await hashPassword(password);

    const rawToken  = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await prisma.$transaction(async (tx) => {

      // INSERT User
      const user = await tx.user.create({
        data: {
          userType:    'EXTERNAL',
          status:      'ACTIVE',
          displayName: name.trim(),
          locale:      'en',
        },
      });

      // INSERT UserIdentifier (verifiedAt=null — set only on token consumption)
      await tx.userIdentifier.create({
        data: {
          userId:     user.id,
          type:       'EMAIL',
          value:      normalizedEmail,
          isPrimary:  true,
          verifiedAt: null,
        },
      });

      // INSERT Credential
      await tx.credential.create({
        data: {
          userId:       user.id,
          passwordHash: hash,
          passwordAlgo: algo,
        },
      });

      // READ Role(member)
      
      const memberRole = await tx.role.findUnique({ where: { name: 'member' } });
      if (!memberRole) {
        throw new Error("Role 'member' not found. Run: npx prisma db seed");
      }

      // INSERT UserRole(member)
      await tx.userRole.create({
        data: {
          userId:     user.id,
          roleId:     memberRole.id,
          assignedBy: null,
        },
      });

      // INSERT VerificationToken
      await tx.verificationToken.create({
        data: {
          userId:          user.id,
          purpose:         'email_verify',
          token:           rawToken,
          expiresAt,
          consumedAt:      null,
          identifierType:  'EMAIL',
          identifierValue: normalizedEmail,
        },
      });

      // INSERT AuditLog USER_CREATED
      await tx.auditLog.create({
        data: {
          action:       'USER_CREATED',
          actorId:      user.id,
          targetUserId: user.id,
          ip,
          userAgent,
          meta: {
            status:             'SUCCESS',
            registrationMethod: 'manual_lawyer_signup',
            email:              normalizedEmail,
            role:               'member',
            // Store lawyer details for later verification process
            barCouncilNo,
            jurisdiction,
            expertise,
          },
        },
      });

      return user;
    });

          
    await sendVerificationEmail({
      to:    normalizedEmail,
      name:  newUser.displayName ?? name,
      token: rawToken,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Please check your inbox to verify your email.',
        step:    'complete',
        user: {
          id:        newUser.id,
          name:      newUser.displayName,
          email:     normalizedEmail,
          role:      'member',   // lawyer role assigned after admin approval
          status:    'ACTIVE',
          verified:  false,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('[LAWYER_REGISTER_ERROR]', err);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong during registration. Please try again.', step: 'server' },
      { status: 500 }
    );
  }
}
