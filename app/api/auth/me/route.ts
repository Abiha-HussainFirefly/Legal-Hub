import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    select: {
      expiresAt: true,
      userId: true,
      user: {
        select: {
          displayName: true,
          identifiers: {
            where: { type: 'EMAIL' },
            select: { value: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      name:  session.user?.displayName ?? null,
      email: session.user?.identifiers?.[0]?.value ?? null,
    },
  });
}
