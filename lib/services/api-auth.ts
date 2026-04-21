// lib/services/api-auth.ts
import { NextRequest } from "next/server";
import { getCurrentUserQuery } from "@/lib/actions/auth";

export async function getSessionUser(req: NextRequest) {
  const token =
    req.cookies.get("session_token")?.value ||
    req.cookies.get("next-auth.session-token")?.value || // fallback
    req.cookies.get("__Secure-next-auth.session-token")?.value; // prod fallback

  if (!token) return null;

  const ip =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    null;

  const userAgent = req.headers.get("user-agent") ?? null;

  const result = await getCurrentUserQuery(token, ip, userAgent);

  if (!result?.authenticated) return null;

  return result.user;
}