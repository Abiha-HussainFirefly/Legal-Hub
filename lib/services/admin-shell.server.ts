import { prisma } from "@/lib/prisma";
import { AIAlertStatus, NotificationType, ReportStatus } from "@prisma/client";

export interface AdminShellNotificationItem {
  id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  relativeTime: string;
  relatedLabel: string | null;
  relatedHref: string | null;
}

export interface AdminShellNotificationsData {
  unreadCount: number;
  items: AdminShellNotificationItem[];
}

export interface AdminShellSearchResult {
  id: string;
  label: string;
  subLabel: string;
  type: "User" | "Case" | "Discussion" | "Verification" | "Report" | "AI Alert";
  href: string;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function formatAgeLabel(value: Date, now: Date) {
  const diff = now.getTime() - value.getTime();

  if (diff < 60 * 1000) {
    return "Just now";
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.max(1, Math.floor(diff / (60 * 1000)))} min ago`;
  }

  if (diff < DAY_IN_MS) {
    return `${Math.max(1, Math.floor(diff / (60 * 60 * 1000)))} hr ago`;
  }

  return `${Math.max(1, Math.floor(diff / DAY_IN_MS))} day ago`;
}

function buildDiscussionHref(slug: string) {
  return `/discussion-ops/${slug}`;
}

function buildCaseHref(slug: string) {
  return `/case-review/${slug}`;
}

function buildUserHref(userId: string, tab?: string) {
  return tab ? `/user/${userId}?tab=${tab}` : `/user/${userId}`;
}

function prettyText(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAnswerTarget(answer: { id: string; discussion: { slug: string; title: string } | null }) {
  if (answer.discussion) {
    return {
      label: `Answer on ${answer.discussion.title}`,
      href: buildDiscussionHref(answer.discussion.slug),
    };
  }

  return {
    label: `Answer ${answer.id}`,
    href: "/moderation",
  };
}

function buildCommentTarget(comment: {
  id: string;
  discussion: { slug: string; title: string } | null;
  caseRecord: { slug: string; title: string } | null;
}) {
  if (comment.discussion) {
    return {
      label: `Comment on ${comment.discussion.title}`,
      href: buildDiscussionHref(comment.discussion.slug),
    };
  }

  if (comment.caseRecord) {
    return {
      label: `Comment on ${comment.caseRecord.title}`,
      href: buildCaseHref(comment.caseRecord.slug),
    };
  }

  return {
    label: `Comment ${comment.id}`,
    href: "/moderation",
  };
}

export async function getAdminShellNotifications(limit = 6): Promise<AdminShellNotificationsData> {
  const now = new Date();

  const [unreadCount, rows] = await Promise.all([
    prisma.notification.count({
      where: {
        isRead: false,
      },
    }),
    prisma.notification.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: Math.min(Math.max(limit, 1), 12),
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        discussion: { select: { slug: true, title: true } },
        answer: { select: { id: true, discussion: { select: { slug: true, title: true } } } },
        comment: {
          select: {
            id: true,
            discussion: { select: { slug: true, title: true } },
            caseRecord: { select: { slug: true, title: true } },
          },
        },
        caseRecord: { select: { slug: true, title: true } },
        organization: { select: { name: true } },
      },
    }),
  ]);

  return {
    unreadCount,
    items: rows.map((row) => {
      let relatedLabel: string | null = null;
      let relatedHref: string | null = null;

      if (row.discussion) {
        relatedLabel = row.discussion.title;
        relatedHref = buildDiscussionHref(row.discussion.slug);
      } else if (row.answer) {
        const target = buildAnswerTarget(row.answer);
        relatedLabel = target.label;
        relatedHref = target.href;
      } else if (row.comment) {
        const target = buildCommentTarget(row.comment);
        relatedLabel = target.label;
        relatedHref = target.href;
      } else if (row.caseRecord) {
        relatedLabel = row.caseRecord.title;
        relatedHref = buildCaseHref(row.caseRecord.slug);
      } else if (row.organization) {
        relatedLabel = row.organization.name;
      }

      return {
        id: row.id,
        title: row.title,
        message: row.message ?? null,
        type: row.type,
        isRead: row.isRead,
        createdAt: row.createdAt.toISOString(),
        relativeTime: formatAgeLabel(row.createdAt, now),
        relatedLabel,
        relatedHref,
      };
    }),
  };
}

export async function searchAdminShell(query: string, limit = 8): Promise<AdminShellSearchResult[]> {
  const q = query.trim();

  if (!q) return [];

  const safeLimit = Math.min(Math.max(limit, 1), 12);

  const [users, cases, discussions, verificationRequests, reports, alerts] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { identifiers: { some: { value: { contains: q, mode: "insensitive" } } } },
          { profile: { is: { username: { contains: q, mode: "insensitive" } } } },
        ],
      },
      orderBy: [{ lastLoginAt: "desc" }, { createdAt: "desc" }],
      take: safeLimit,
      select: {
        id: true,
        displayName: true,
        identifiers: {
          where: { isPrimary: true },
          select: { value: true },
          take: 1,
        },
        profile: {
          select: {
            username: true,
          },
        },
      },
    }),
    prisma.caseRecord.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { canonicalCitation: { contains: q, mode: "insensitive" } },
          { docketNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: safeLimit,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        court: { select: { name: true } },
      },
    }),
    prisma.discussion.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: safeLimit,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        category: { select: { name: true } },
      },
    }),
    prisma.lawyerVerificationRequest.findMany({
      where: {
        OR: [
          { lawyerProfile: { is: { user: { displayName: { contains: q, mode: "insensitive" } } } } },
          { lawyerProfile: { is: { barCouncil: { contains: q, mode: "insensitive" } } } },
          { lawyerProfile: { is: { barLicenseNumber: { contains: q, mode: "insensitive" } } } },
        ],
      },
      orderBy: [{ submittedAt: "desc" }],
      take: safeLimit,
      select: {
        id: true,
        status: true,
        lawyerProfile: {
          select: {
            barCouncil: true,
            barLicenseNumber: true,
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    }),
    prisma.contentReport.findMany({
      where: {
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { reporter: { is: { displayName: { contains: q, mode: "insensitive" } } } },
          { reportedUser: { is: { displayName: { contains: q, mode: "insensitive" } } } },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: safeLimit,
      select: {
        id: true,
        reason: true,
        status: true,
        targetType: true,
      },
    }),
    prisma.aIAlert.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { source: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ detectedAt: "desc" }],
      take: safeLimit,
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
      },
    }),
  ]);

  const results: AdminShellSearchResult[] = [
    ...users.map((row) => ({
      id: `user-${row.id}`,
      label: row.displayName ?? "Unnamed member",
      subLabel: [row.identifiers[0]?.value ?? null, row.profile?.username ? `@${row.profile.username}` : null]
        .filter(Boolean)
        .join(" / ") || "User record",
      type: "User" as const,
      href: buildUserHref(row.id),
    })),
    ...cases.map((row) => ({
      id: `case-${row.id}`,
      label: row.title,
      subLabel: [prettyText(row.status), row.court?.name ?? null].filter(Boolean).join(" / "),
      type: "Case" as const,
      href: buildCaseHref(row.slug),
    })),
    ...discussions.map((row) => ({
      id: `discussion-${row.id}`,
      label: row.title,
      subLabel: [prettyText(row.status), row.category?.name ?? null].filter(Boolean).join(" / "),
      type: "Discussion" as const,
      href: buildDiscussionHref(row.slug),
    })),
    ...verificationRequests.map((row) => ({
      id: `verification-${row.id}`,
      label: row.lawyerProfile.user.displayName ?? "Unnamed lawyer",
      subLabel: [prettyText(row.status), row.lawyerProfile.barLicenseNumber ?? null, row.lawyerProfile.barCouncil ?? null]
        .filter(Boolean)
        .join(" / "),
      type: "Verification" as const,
      href: buildUserHref(row.lawyerProfile.user.id, "trust"),
    })),
    ...reports
      .filter((row) => row.status === ReportStatus.OPEN || row.status === ReportStatus.UNDER_REVIEW)
      .map((row) => ({
        id: `report-${row.id}`,
        label: `${prettyText(row.reason)} report`,
        subLabel: [prettyText(row.status), prettyText(row.targetType)].join(" / "),
        type: "Report" as const,
        href: `/moderation?tab=reports`,
      })),
    ...alerts
      .filter((row) => row.status === AIAlertStatus.OPEN || row.status === AIAlertStatus.ACKNOWLEDGED)
      .map((row) => ({
        id: `alert-${row.id}`,
        label: row.title,
        subLabel: [prettyText(row.severity), prettyText(row.status)].join(" / "),
        type: "AI Alert" as const,
        href: `/moderation?tab=alerts`,
      })),
  ];

  return results.slice(0, safeLimit);
}
