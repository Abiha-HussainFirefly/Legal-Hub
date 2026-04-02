import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session_token')?.value;

  if (token) {
    
    await prisma.session.deleteMany({
      where: { sessionToken: token },
    }).catch(() => {});
  }

  const res = NextResponse.json({ success: true });

  res.cookies.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return res;
}
