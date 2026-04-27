import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionToken } from "@/lib/auth/session-cookie";

const ADMIN_PROTECTED_PREFIXES = [
  "/adminprofile",
  "/dashboard",
  "/case-review",
  "/moderation",
  "/reports",
  "/settings",
  "/user",
  "/verification",
] as const;

const LAWYER_PROTECTED_PATHS = new Set([
  "/profile",
  "/saved",
  "/topics",
]);

const LAWYER_PROTECTED_PREFIXES = [
  "/cases/mine",
  "/cases/new",
  "/cases/saved",
  "/profile/edit",
  "/profile/setup",
  "/profile/stats",
] as const;

function matchesExactOrNested(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isAdminProtectedPath(pathname: string) {
  return ADMIN_PROTECTED_PREFIXES.some((route) => matchesExactOrNested(pathname, route));
}

function isLawyerProtectedPath(pathname: string) {
  if (LAWYER_PROTECTED_PATHS.has(pathname)) {
    return true;
  }

  if (LAWYER_PROTECTED_PREFIXES.some((route) => matchesExactOrNested(pathname, route))) {
    return true;
  }

  return /^\/cases\/[^/]+\/edit(?:\/.*)?$/.test(pathname);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = readSessionToken(req);
  const isLoggedIn = !!token;

  if (!isLoggedIn && isAdminProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/adminlogin", req.url));
  }

  if (!isLoggedIn && isLawyerProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/lawyerlogin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/adminprofile/:path*",
    "/dashboard/:path*",
    "/case-review/:path*",
    "/moderation/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/user/:path*",
    "/verification/:path*",
    "/cases/mine/:path*",
    "/cases/new/:path*",
    "/cases/saved/:path*",
    "/cases/:slug/edit/:path*",
    "/topics/:path*",
    "/saved/:path*",
    "/profile",
    "/profile/edit/:path*",
    "/profile/setup/:path*",
    "/profile/stats/:path*",
  ],
};
