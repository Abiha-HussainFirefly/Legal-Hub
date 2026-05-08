import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/services/api-auth";
import {
  getAdminCaseReviewQueueData,
  getAdminFilesPageData,
  getAdminModerationQueueData,
  getAdminNotificationsPageData,
  getAdminPermissionsPageData,
  getAdminRolesPageData,
  getAdminSecurityPageData,
  getAdminUsersPageData,
  getAdminVerificationQueueData,
} from "@/lib/services/admin.server";
import { AuditCategory } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

function escapeCsv(value: string | number | boolean | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
}

function prettyText(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function firstParam(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() ?? "";
}

function buildCsv(header: string[], rows: Array<Array<string | number | boolean | null | undefined>>) {
  return [header.map((value) => escapeCsv(value)).join(","), ...rows.map((row) => row.map((value) => escapeCsv(value)).join(","))].join("\n");
}

async function collectPaginatedRows<TRow>(
  loader: (page: number) => Promise<{ pagination: { totalPages: number }; rows: TRow[] }>,
) {
  const firstPage = await loader(1);
  const collectedRows = [...firstPage.rows];

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const nextPage = await loader(page);
    collectedRows.push(...nextPage.rows);
  }

  return { rows: collectedRows };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];

  if (!user?.id || !canAccessAdminPermission(roles, permissions, ADMIN_PERMISSION_KEYS.EXPORTS_VIEW)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const dataset = firstParam(params, "dataset");

  if (!dataset) {
    return NextResponse.json({ error: "Missing dataset" }, { status: 400 });
  }

  let filenameBase = "export";
  let csv = "";
  let rowCount = 0;
  let filterMeta: Record<string, string> = {};

  if (dataset === "users") {
    filterMeta = {
      q: firstParam(params, "q"),
      status: firstParam(params, "status"),
      userType: firstParam(params, "userType"),
      role: firstParam(params, "role"),
      verification: firstParam(params, "verification"),
      identifier: firstParam(params, "identifier"),
      mfa: firstParam(params, "mfa"),
      risk: firstParam(params, "risk"),
      createdFrom: firstParam(params, "createdFrom"),
      createdTo: firstParam(params, "createdTo"),
      lastLoginFrom: firstParam(params, "lastLoginFrom"),
      lastLoginTo: firstParam(params, "lastLoginTo"),
    };

    const { rows } = await collectPaginatedRows((page) =>
      getAdminUsersPageData({
        ...filterMeta,
        page,
        pageSize: 50,
      }),
    );

    rowCount = rows.length;
    filenameBase = "users";
    csv = buildCsv(
      [
        "User ID",
        "Display Name",
        "Username",
        "Primary Email",
        "Roles",
        "Status",
        "Verification Status",
        "Lawyer Flag",
        "Organization Count",
        "MFA Count",
        "Region",
        "Last Login",
        "Created At",
      ],
      rows.map((row) => [
        row.id,
        row.displayName,
        row.username,
        row.email,
        row.roles.join(" | "),
        prettyText(row.status),
        prettyText(row.verificationStatus),
        row.isLawyer ? "Yes" : "No",
        row.organizationCount,
        row.activeMfaCount,
        row.regionName,
        row.lastLoginAt?.toISOString() ?? "",
        row.createdAt.toISOString(),
      ]),
    );
  } else if (dataset === "verification") {
    filterMeta = {
      q: firstParam(params, "q"),
      status: firstParam(params, "status"),
      region: firstParam(params, "region"),
      missingDocs: firstParam(params, "missingDocs"),
    };

    const { rows } = await collectPaginatedRows((page) =>
      getAdminVerificationQueueData({
        ...filterMeta,
        page,
        pageSize: 50,
      }),
    );

    rowCount = rows.length;
    filenameBase = "verification";
    csv = buildCsv(
      [
        "Request ID",
        "User ID",
        "Display Name",
        "Username",
        "Region",
        "Bar Council",
        "Bar License Number",
        "Status",
        "Submitted At",
        "Reviewed At",
        "Reviewed By",
        "Expires At",
        "Document Count",
        "Missing Required Documents",
        "Flagged Document Count",
        "Admin Note",
        "Rejection Reason",
      ],
      rows.map((row) => [
        row.id,
        row.userId,
        row.displayName,
        row.username,
        row.regionName,
        row.barCouncil,
        row.barLicenseNumber,
        prettyText(row.status),
        row.submittedAt.toISOString(),
        row.reviewedAt?.toISOString() ?? "",
        row.reviewedBy,
        row.expiresAt?.toISOString() ?? "",
        row.documentCount,
        row.missingRequiredDocuments.map((item) => prettyText(item)).join(" | "),
        row.flaggedDocumentCount,
        row.adminNote,
        row.rejectionReason,
      ]),
    );
  } else if (dataset === "moderation") {
    const tab = firstParam(params, "tab") || "reports";
    filterMeta = {
      tab,
      q: firstParam(params, "q"),
      targetType: firstParam(params, "targetType"),
      severity: firstParam(params, "severity"),
      status: firstParam(params, "status"),
    };

    const firstPage = await getAdminModerationQueueData({
      ...filterMeta,
      page: 1,
      pageSize: 50,
    });

    const totalPages = firstPage.pagination.totalPages;
    const reports = [...firstPage.reports];
    const alerts = [...firstPage.alerts];
    const actions = [...firstPage.actions];

    for (let page = 2; page <= totalPages; page += 1) {
      const nextPage = await getAdminModerationQueueData({
        ...filterMeta,
        page,
        pageSize: 50,
      });
      reports.push(...nextPage.reports);
      alerts.push(...nextPage.alerts);
      actions.push(...nextPage.actions);
    }

    if (tab === "alerts") {
      rowCount = alerts.length;
      filenameBase = "moderation-alerts";
      csv = buildCsv(
        [
          "Alert ID",
          "Source",
          "Target Type",
          "Severity",
          "Status",
          "Title",
          "Description",
          "Risk Score",
          "Detected At",
          "Reviewed At",
          "Reviewer",
          "Target Label",
          "Target Href",
        ],
        alerts.map((row) => [
          row.id,
          row.source,
          prettyText(row.targetType),
          prettyText(row.severity),
          prettyText(row.status),
          row.title,
          row.description,
          row.riskScore ?? "",
          row.detectedAt.toISOString(),
          row.reviewedAt?.toISOString() ?? "",
          row.reviewer,
          row.targetLabel,
          row.targetHref,
        ]),
      );
    } else if (tab === "actions") {
      rowCount = actions.length;
      filenameBase = "moderation-actions";
      csv = buildCsv(
        [
          "Action ID",
          "Action Type",
          "Reason",
          "Note",
          "Created At",
          "Moderator",
          "Target Type",
          "Target Label",
          "Target Href",
        ],
        actions.map((row) => [
          row.id,
          prettyText(row.actionType),
          row.reason,
          row.note,
          row.createdAt.toISOString(),
          row.moderator,
          prettyText(row.targetType),
          row.targetLabel,
          row.targetHref,
        ]),
      );
    } else {
      rowCount = reports.length;
      filenameBase = "moderation-reports";
      csv = buildCsv(
        [
          "Report ID",
          "Target Type",
          "Reason",
          "Status",
          "Description",
          "Created At",
          "Reviewed At",
          "Reviewer",
          "Resolution Note",
          "Reporter",
          "Reported User",
          "Target Label",
          "Target Href",
        ],
        reports.map((row) => [
          row.id,
          prettyText(row.targetType),
          prettyText(row.reason),
          prettyText(row.status),
          row.description,
          row.createdAt.toISOString(),
          row.reviewedAt?.toISOString() ?? "",
          row.reviewer,
          row.resolutionNote,
          row.reporterName,
          row.reportedUserName,
          row.targetLabel,
          row.targetHref,
        ]),
      );
    }
  } else if (dataset === "cases") {
    filterMeta = {
      q: firstParam(params, "q"),
      status: firstParam(params, "status"),
      sourceType: firstParam(params, "sourceType"),
      region: firstParam(params, "region"),
      court: firstParam(params, "court"),
      organization: firstParam(params, "organization"),
      reviewedBy: firstParam(params, "reviewedBy"),
    };

    const { rows } = await collectPaginatedRows((page) =>
      getAdminCaseReviewQueueData({
        ...filterMeta,
        page,
        pageSize: 50,
      }),
    );

    rowCount = rows.length;
    filenameBase = "case-review";
    csv = buildCsv(
      [
        "Case ID",
        "Slug",
        "Title",
        "Canonical Citation",
        "Status",
        "Visibility",
        "Source Type",
        "Created At",
        "Reviewed At",
        "Published At",
        "Author",
        "Organization",
        "Category",
        "Court",
        "Region",
        "Reviewed By",
        "Revision Count",
        "Source Link Count",
        "Source File Count",
        "Flagged File Count",
        "Open Reports",
        "AI Alerts",
      ],
      rows.map((row) => [
        row.id,
        row.slug,
        row.title,
        row.canonicalCitation,
        prettyText(row.status),
        prettyText(row.visibility),
        prettyText(row.sourceType),
        row.createdAt.toISOString(),
        row.reviewedAt?.toISOString() ?? "",
        row.publishedAt?.toISOString() ?? "",
        row.authorName,
        row.organizationName,
        row.categoryName,
        row.courtName,
        row.regionName,
        row.reviewedBy,
        row.revisionCount,
        row.sourceLinkCount,
        row.sourceFileCount,
        row.flaggedFileCount,
        row.openReports,
        row.aiAlerts,
      ]),
    );
  } else if (dataset === "files") {
    filterMeta = {
      q: firstParam(params, "q"),
      scanStatus: firstParam(params, "scanStatus"),
      parentType: firstParam(params, "parentType"),
    };

    const { rows } = await collectPaginatedRows((page) =>
      getAdminFilesPageData({
        ...filterMeta,
        page,
        pageSize: 50,
      }),
    );

    rowCount = rows.length;
    filenameBase = "files";
    csv = buildCsv(
      [
        "Asset ID",
        "Original File Name",
        "MIME Type",
        "File Size",
        "Uploader",
        "Scan Status",
        "Scan Completed At",
        "Public Reachable",
        "Created At",
        "Parent Count",
        "Parent Summaries",
      ],
      rows.map((row) => [
        row.id,
        row.originalFileName,
        row.mimeType,
        row.fileSize ?? "",
        row.uploaderName,
        prettyText(row.scanStatus),
        row.scanCompletedAt?.toISOString() ?? "",
        row.isPublic ? "Yes" : "No",
        row.createdAt.toISOString(),
        row.parentCount,
        row.parentSummaries.map((parent) => `${prettyText(parent.type)}: ${parent.label}`).join(" | "),
      ]),
    );
  } else if (dataset === "notifications") {
    filterMeta = {
      q: firstParam(params, "q"),
      type: firstParam(params, "type"),
      read: firstParam(params, "read"),
      recipient: firstParam(params, "recipient"),
      actor: firstParam(params, "actor"),
    };

    const { rows } = await collectPaginatedRows((page) =>
      getAdminNotificationsPageData({
        ...filterMeta,
        page,
        pageSize: 50,
      }),
    );

    rowCount = rows.length;
    filenameBase = "notifications";
    csv = buildCsv(
      [
        "Notification ID",
        "Type",
        "Title",
        "Message",
        "Read State",
        "Created At",
        "Recipient",
        "Actor",
        "Related Label",
        "Related Href",
      ],
      rows.map((row) => [
        row.id,
        prettyText(row.type),
        row.title,
        row.message,
        row.isRead ? "Read" : "Unread",
        row.createdAt.toISOString(),
        row.recipientName,
        row.actorName,
        row.relatedLabel,
        row.relatedHref,
      ]),
    );
  } else if (dataset === "roles") {
    filterMeta = {
      q: firstParam(params, "q"),
    };

    const data = await getAdminRolesPageData(filterMeta);
    rowCount = data.rows.length;
    filenameBase = "roles";
    csv = buildCsv(
      [
        "Role ID",
        "Name",
        "Description",
        "System Role",
        "User Count",
        "Permission Count",
        "Permissions",
      ],
      data.rows.map((row) => [
        row.id,
        row.name,
        row.description,
        row.isSystem ? "Yes" : "No",
        row.userCount,
        row.permissionCount,
        row.permissions.join(" | "),
      ]),
    );
  } else if (dataset === "permissions") {
    filterMeta = {
      q: firstParam(params, "q"),
      module: firstParam(params, "module"),
    };

    const data = await getAdminPermissionsPageData(filterMeta);
    rowCount = data.rows.length;
    filenameBase = "permissions";
    csv = buildCsv(
      [
        "Permission ID",
        "Key",
        "Description",
        "Module",
        "Role Count",
        "Bound Roles",
      ],
      data.rows.map((row) => [
        row.id,
        row.key,
        row.description,
        row.module,
        row.roleCount,
        data.roles
          .filter((role) => row.roleIds.includes(role.id))
          .map((role) => role.name)
          .join(" | "),
      ]),
    );
  } else if (dataset === "audit") {
    filterMeta = {
      q: firstParam(params, "q"),
      category: firstParam(params, "category"),
      failedOnly: firstParam(params, "failedOnly"),
      privilegedOnly: firstParam(params, "privilegedOnly"),
    };

    const data = await getAdminSecurityPageData(filterMeta);
    rowCount = data.auditRows.length;
    filenameBase = "audit-security";
    csv = buildCsv(
      [
        "Audit ID",
        "Category",
        "Action",
        "Actor",
        "Target User ID",
        "Target User",
        "Target Type",
        "Created At",
        "Meta Summary",
      ],
      data.auditRows.map((row) => [
        row.id,
        prettyText(row.category),
        row.action,
        row.actorName,
        row.targetUserId,
        row.targetUserName,
        prettyText(row.targetType),
        row.createdAt.toISOString(),
        row.metaSummary,
      ]),
    );
  } else {
    return NextResponse.json({ error: "Unsupported dataset" }, { status: 400 });
  }

  await prisma.auditLog.create({
    data: {
      category: AuditCategory.SYSTEM,
      action: "ADMIN_EXPORT_DATASET",
      actorId: user.id,
      meta: {
        dataset,
        rowCount,
        filters: filterMeta,
      },
    },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="legal-hub-${filenameBase}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
