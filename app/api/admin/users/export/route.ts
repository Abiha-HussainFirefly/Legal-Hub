import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/services/api-auth";
import { AuditCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

function escapeCsv(value: string | null | undefined) {
  const normalized = value ?? "";
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function prettyText(value: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];

  if (!user?.id || !canAccessAdminPermission(roles, permissions, ADMIN_PERMISSION_KEYS.USERS_MANAGE)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idsParam = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 200);

  if (!ids.length) {
    return NextResponse.json({ error: "No user IDs provided" }, { status: 400 });
  }

  const rows = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      displayName: true,
      userType: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      identifiers: {
        where: { isPrimary: true },
        select: { type: true, value: true, verifiedAt: true },
      },
      roles: {
        select: { role: { select: { name: true } } },
      },
      profile: {
        select: {
          username: true,
          isLawyer: true,
          primaryRegion: { select: { name: true } },
        },
      },
      lawyerProfile: {
        select: { verificationStatus: true },
      },
      organizationMemberships: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      mfaFactors: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "User ID",
    "Display Name",
    "Username",
    "Primary Identifier",
    "Identifier Verified",
    "Roles",
    "Status",
    "User Type",
    "Verification State",
    "Lawyer Flag",
    "Organization Count",
    "MFA Enabled",
    "Region",
    "Last Login",
    "Created At",
  ];

  const csvRows = rows.map((row) => {
    const primaryIdentifier = row.identifiers[0];
    return [
      row.id,
      row.displayName ?? "",
      row.profile?.username ?? "",
      primaryIdentifier?.value ?? "",
      primaryIdentifier?.verifiedAt ? "Yes" : "No",
      row.roles.map((item) => item.role.name).join(" | "),
      prettyText(row.status),
      prettyText(row.userType),
      prettyText(row.lawyerProfile?.verificationStatus ?? null),
      row.profile?.isLawyer ? "Yes" : "No",
      `${row.organizationMemberships.length}`,
      row.mfaFactors.length > 0 ? "Yes" : "No",
      row.profile?.primaryRegion?.name ?? "",
      row.lastLoginAt?.toISOString() ?? "",
      row.createdAt.toISOString(),
    ]
      .map((value) => escapeCsv(value))
      .join(",");
  });

  const csv = [header.join(","), ...csvRows].join("\n");

  await prisma.auditLog.create({
    data: {
      category: AuditCategory.SYSTEM,
      action: "ADMIN_EXPORT_USERS_SELECTED",
      actorId: user.id,
      meta: {
        dataset: "users_selected",
        selectedIds: ids,
        rowCount: rows.length,
      },
    },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="legal-hub-users-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
