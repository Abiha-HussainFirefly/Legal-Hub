import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { searchAdminShell } from "@/lib/services/admin-shell.server";
import { getSessionUser } from "@/lib/services/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];

  if (!user?.id || !canAccessAdminPermission(roles, permissions, ADMIN_PERMISSION_KEYS.DASHBOARD_VIEW)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const q = params.get("q")?.trim() ?? "";
  const limitParam = params.get("limit");
  const limit = Number.parseInt(limitParam ?? "8", 10);
  const results = await searchAdminShell(q, Number.isFinite(limit) ? limit : 8);

  return NextResponse.json({ results });
}
