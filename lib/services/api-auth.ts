// lib/services/api-auth.ts
import { NextRequest } from "next/server";
import { getCurrentUserQuery } from "@/lib/actions/auth";
import { readSessionToken } from "@/lib/auth/session-cookie";

export async function getSessionUser(req: NextRequest) {
  const token = readSessionToken(req);

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
