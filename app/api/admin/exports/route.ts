import { ADMIN_PERMISSION_KEYS, canAccessAdminPermission } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/services/api-auth";
import {
  getAdminCaseReviewQueueData,
  getAdminFilesPageData,
  getAdminModerationQueueData,
  getAdminNotificationsPageData,
  getAdminPermissionsPageData,
  getAdminReportsData,
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

function buildAdminReportsCsv(
  data: Awaited<ReturnType<typeof getAdminReportsData>>,
  section: string,
) {
  if (section === "summary") {
    return buildCsv(
      ["Metric", "Value", "Detail"],
      [
        ["New Users", data.summary.newUsersInRange, `Accounts created in the last ${data.filters.rangeDays} days`],
        ["Published Cases", data.summary.publishedCasesInRange, `Published in the last ${data.filters.rangeDays} days`],
        ["Open Moderation Signals", data.summary.openModerationSignals, "Current open reports plus actionable AI alerts"],
        [
          "Verification Approval Rate",
          data.summary.verificationApprovalRateInRange === null ? "N/A" : `${data.summary.verificationApprovalRateInRange}%`,
          `Decided verification requests in the last ${data.filters.rangeDays} days`,
        ],
        ...data.summaryNotes.map((note, index) => [`Summary Note ${index + 1}`, note, "Narrative highlight"]),
      ],
    );
  }

  if (section === "user_growth") {
    return buildCsv(
      ["Bucket", "New Users"],
      data.userGrowth.map((row) => [row.label, row.users]),
    );
  }

  if (section === "verification") {
    return buildCsv(
      ["Bucket", "Submitted", "Approved", "Rejected"],
      data.verificationThroughput.map((row) => [row.label, row.submitted, row.approved, row.rejected]),
    );
  }

  if (section === "content") {
    return buildCsv(
      ["Bucket", "Discussions", "Answers", "Comments", "Cases"],
      data.contentCreation.map((row) => [row.label, row.discussions, row.answers, row.comments, row.cases]),
    );
  }

  if (section === "moderation") {
    return buildCsv(
      ["Bucket", "Reports", "Alerts", "Actions"],
      data.moderationLoad.map((row) => [row.label, row.reports, row.alerts, row.actions]),
    );
  }

  if (section === "queue_aging") {
    return buildCsv(
      ["Label", "Value", "Href"],
      data.queueAging.map((row) => [row.label, row.value, row.href]),
    );
  }

  if (section === "anomalies") {
    return buildCsv(
      ["Label", "Status", "Detail"],
      data.anomalies.map((row) => [row.label, row.status, row.detail]),
    );
  }

  if (section === "rankings_regions") {
    return buildCsv(
      ["Region", "Count"],
      data.rankings.regions.map((row) => [row.label, row.count]),
    );
  }

  if (section === "rankings_courts") {
    return buildCsv(
      ["Court", "Count"],
      data.rankings.courts.map((row) => [row.label, row.count]),
    );
  }

  if (section === "rankings_categories") {
    return buildCsv(
      ["Category", "Count"],
      data.rankings.categories.map((row) => [row.label, row.count]),
    );
  }

  if (section === "rankings_tags") {
    return buildCsv(
      ["Tag", "Engagement Score"],
      data.rankings.tags.map((row) => [row.label, row.score]),
    );
  }

  const rows: Array<Array<string | number | boolean | null | undefined>> = [
    ...data.summaryNotes.map((note, index) => ["summary_note", `Note ${index + 1}`, "text", note, "", "", ""]),
    ...[
      ["summary", `New Users ${data.filters.rangeDays}d`, "value", data.summary.newUsersInRange, "Accounts created in the selected range", "", ""],
      ["summary", `Published Cases ${data.filters.rangeDays}d`, "value", data.summary.publishedCasesInRange, "Published in the selected range", "", ""],
      ["summary", "Open Moderation Signals", "value", data.summary.openModerationSignals, "Current snapshot", "", ""],
      [
        "summary",
        "Verification Approval Rate",
        "value",
        data.summary.verificationApprovalRateInRange === null ? "N/A" : `${data.summary.verificationApprovalRateInRange}%`,
        "Selected range",
        "",
        "",
      ],
    ],
    ...data.userGrowth.map((row) => ["user_growth", row.label, "users", row.users, "", "", ""]),
    ...data.verificationThroughput.flatMap((row) => [
      ["verification", row.label, "submitted", row.submitted, "", "", ""],
      ["verification", row.label, "approved", row.approved, "", "", ""],
      ["verification", row.label, "rejected", row.rejected, "", "", ""],
    ]),
    ...data.contentCreation.flatMap((row) => [
      ["content", row.label, "discussions", row.discussions, "", "", ""],
      ["content", row.label, "answers", row.answers, "", "", ""],
      ["content", row.label, "comments", row.comments, "", "", ""],
      ["content", row.label, "cases", row.cases, "", "", ""],
    ]),
    ...data.moderationLoad.flatMap((row) => [
      ["moderation", row.label, "reports", row.reports, "", "", ""],
      ["moderation", row.label, "alerts", row.alerts, "", "", ""],
      ["moderation", row.label, "actions", row.actions, "", "", ""],
    ]),
    ...data.queueAging.map((row) => ["queue_aging", row.label, "value", row.value, "", row.href, ""]),
    ...data.anomalies.map((row) => ["anomalies", row.label, "detail", row.detail, "", "", row.status]),
    ...data.rankings.regions.map((row) => ["rankings_regions", row.label, "count", row.count, "", "", ""]),
    ...data.rankings.courts.map((row) => ["rankings_courts", row.label, "count", row.count, "", "", ""]),
    ...data.rankings.categories.map((row) => ["rankings_categories", row.label, "count", row.count, "", "", ""]),
    ...data.rankings.tags.map((row) => ["rankings_tags", row.label, "score", row.score, "", "", ""]),
  ];

  return buildCsv(["Section", "Label", "Metric", "Value", "Detail", "Href", "Status"], rows);
}

function buildAdminReportsJson(
  data: Awaited<ReturnType<typeof getAdminReportsData>>,
  section: string,
) {
  if (section === "user_growth") {
    return {
      section,
      filters: data.filters,
      rows: data.userGrowth,
    };
  }

  if (section === "verification") {
    return {
      section,
      filters: data.filters,
      rows: data.verificationThroughput,
    };
  }

  if (section === "content") {
    return {
      section,
      filters: data.filters,
      rows: data.contentCreation,
    };
  }

  if (section === "moderation") {
    return {
      section,
      filters: data.filters,
      rows: data.moderationLoad,
    };
  }

  return {
    section,
    filters: data.filters,
    rows: [],
  };
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
  let jsonBody: unknown = null;
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
  } else if (dataset === "reports") {
    const section = firstParam(params, "section") || "all";
    const format = firstParam(params, "format") || "csv";

    filterMeta = {
      range: firstParam(params, "range"),
      bucket: firstParam(params, "bucket"),
      rankingLimit: firstParam(params, "rankingLimit"),
      section,
      format,
    };

    const data = await getAdminReportsData({
      range: filterMeta.range,
      bucket: filterMeta.bucket,
      rankingLimit: filterMeta.rankingLimit,
    });

    rowCount =
      data.summaryNotes.length +
      data.userGrowth.length +
      data.verificationThroughput.length +
      data.contentCreation.length +
      data.moderationLoad.length +
      data.queueAging.length +
      data.anomalies.length +
      data.rankings.regions.length +
      data.rankings.courts.length +
      data.rankings.categories.length +
      data.rankings.tags.length;
    filenameBase = section === "all" ? "reports-overview" : `reports-${section}`;

    if (format === "json") {
      jsonBody = buildAdminReportsJson(data, section);
    } else {
      csv = buildAdminReportsCsv(data, section);
    }
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

  if (jsonBody !== null) {
    return new NextResponse(JSON.stringify(jsonBody, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="legal-hub-${filenameBase}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="legal-hub-${filenameBase}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
