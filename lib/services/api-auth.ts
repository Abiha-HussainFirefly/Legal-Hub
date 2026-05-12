// lib/services/api-auth.ts
import { NextRequest } from "next/server";
import { getCurrentUserQuery } from "@/lib/actions/auth";
import { readSessionToken } from "@/lib/auth/session-cookie";
import {
  canAccessLawyerPermission,
  canAccessPermissionRequirement,
  type PermissionRequirement,
  resolveEffectivePermissions,
} from "@/lib/auth/roles";

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
  permissionRequirement: PermissionRequirement,
) {
  if (!user) return false;
  return canAccessPermissionRequirement(getUserEffectivePermissions(user), permissionRequirement);
}
