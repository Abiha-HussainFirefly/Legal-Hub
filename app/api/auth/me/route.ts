import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/prisma';


export async function GET(req: NextRequest) {
  const token = req.cookies.get('session_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    select: {
      expiresAt:  true,
      revokedAt:  true,   
      userId:     true,
      user: {
        select: {
          status:      true,  
          deletedAt:   true,   
          displayName: true,
          roles: {
            include: { role: { select: { name: true } } },
          },
          identifiers: {
            where:  { type: 'EMAIL', isPrimary: true },
            select: { value: true },
            take:   1,
          },
        },
      },
    },
  });

  const now = new Date();

  const isExpired   = !session || session.expiresAt < now;
  const isRevoked   = session?.revokedAt !== null && session?.revokedAt !== undefined;
  const isInactive  = session?.user?.status !== 'ACTIVE';
  const isDeleted   = session?.user?.deletedAt !== null && session?.user?.deletedAt !== undefined;

  if (!session || isExpired || isRevoked || isInactive || isDeleted) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Return authenticated user info
  const roles = session.user?.roles?.map(r => r.role.name) ?? [];

  return NextResponse.json({
    authenticated: true,
    user: {
      id:          session.userId,
      name:        session.user?.displayName ?? null,
      email:       session.user?.identifiers?.[0]?.value ?? null,
      roles,                          // e.g. ["member"] or ["admin"]
      primaryRole: roles[0] ?? null,  
    },
  });
}
