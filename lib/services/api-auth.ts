// lib/services/api-auth.ts
import { NextRequest } from "next/server";
import { getCurrentUserQuery } from "@/lib/actions/auth";
import {
  canAccessLawyerPermission,
  canAccessPermissionRequirement,
  resolveEffectivePermissions,
} from "@/lib/auth/roles";

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

export function getUserEffectivePermissions(user: { roles?: string[]; permissions?: string[] } | null | undefined) {
  if (!user) return [];
  return resolveEffectivePermissions(user.roles ?? [], user.permissions ?? []);
}

export function userHasLawyerPermission(
  user: { roles?: string[]; permissions?: string[] } | null | undefined,
  permissionKey: string,
) {
  if (!user) return false;
  return canAccessLawyerPermission(user.roles ?? [], user.permissions ?? [], permissionKey);
}

export function userHasPermissionRequirement(
  user: { roles?: string[]; permissions?: string[] } | null | undefined,
  permissionRequirement: string | string[],
) {
  if (!user) return false;
  return canAccessPermissionRequirement(getUserEffectivePermissions(user), permissionRequirement);
}
