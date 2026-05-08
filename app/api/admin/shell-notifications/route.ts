import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { getAdminShellNotifications } from "@/lib/services/admin-shell.server";
import { getSessionUser } from "@/lib/services/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];

  if (!user?.id || !canAccessAdminPermission(roles, permissions, ADMIN_PERMISSION_KEYS.NOTIFICATIONS_MANAGE)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = new URL(req.url).searchParams.get("limit");
  const limit = Number.parseInt(limitParam ?? "6", 10);
  const data = await getAdminShellNotifications(Number.isFinite(limit) ? limit : 6);

  return NextResponse.json(data);
}
