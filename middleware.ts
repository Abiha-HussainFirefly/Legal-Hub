import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "session_token",
];

function getSessionToken(req: NextRequest): string | undefined {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = req.cookies.get(name)?.value;
    if (value) return value;
  }
  return undefined;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token     = getSessionToken(req);
  const isLoggedIn = !!token;

  const isAdminAuth    = pathname === "/adminlogin";
  const isLawyerAuth   = pathname === "/lawyerlogin" || pathname === "/lawyerregister";

  const isAdminProtected  = pathname.startsWith("/dashboard");
  const isLawyerProtected = pathname.startsWith("/cases") || pathname.startsWith("/topics") || pathname.startsWith("/saved") || pathname === "/profile" || pathname.startsWith("/profile/edit") || pathname.startsWith("/profile/setup") || pathname.startsWith("/profile/stats");

  if (isAdminProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/adminlogin", req.url));
  }

  if (isLawyerProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/lawyerlogin", req.url));
  }

  if (isAdminAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isLawyerAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/discussions", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/discussions/:path*",
    "/cases/:path*",
    "/topics/:path*",
    "/saved/:path*",
    "/profile/:path*",
    "/adminlogin",
    "/lawyerlogin",
    "/lawyerregister",
  ],
};