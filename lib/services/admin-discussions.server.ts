import { prisma } from "@/lib/prisma";
import {
  AIAlertStatus,
  ContentStatus,
  ContentVisibility,
  DiscussionStatus,
  DiscussionType,
  ReportStatus,
  SummaryStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

const OPEN_REPORT_STATUSES = [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW];
const OPEN_ALERT_STATUSES = [AIAlertStatus.OPEN, AIAlertStatus.ACKNOWLEDGED];
const SEEDED_DISCUSSION_IDENTITY_PARTS = ["ahmed ali", "shahid khan", "nimra khan", "hassan raza", "fatima noor"] as const;

function normalizeSort(sort: string) {
  switch (sort) {
    case "newest":
    case "last_activity":
    case "most_viewed":
    case "most_answered":
    case "most_reported":
    case "most_reacted":
    case "oldest_unresolved":
      return sort;
    default:
      return "last_activity";
  }
}

function toPage(value?: number) {
  if (!value || Number.isNaN(value)) return 1;
  return Math.max(1, value);
}

function toPageSize(value?: number) {
  if (!value || Number.isNaN(value)) return 12;
  return Math.min(Math.max(1, value), 30);
}

function prettyText(value: string | null) {
  if (!value) return "Not available";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildRealDiscussionUserWhere(): Prisma.UserWhereInput {
  return {
    AND: [
      {
        NOT: {
          identifiers: {
            some: {
              type: "EMAIL",
              value: {
                endsWith: "@legalhub.demo",
                mode: "insensitive",
              },
            },
          },
        },
      },
      ...SEEDED_DISCUSSION_IDENTITY_PARTS.map((part) => ({
        NOT: {
          displayName: {
            contains: part,
            mode: "insensitive" as const,
          },
        },
      })),
    ],
  };
}

function matchesSeededDiscussionIdentity(value: string | null | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return SEEDED_DISCUSSION_IDENTITY_PARTS.some((part) => normalized.includes(part)) || normalized.includes("@legalhub.demo");
}

export interface AdminDiscussionsFilters {
  q?: string;
  kind?: string;
  status?: string;
  contentStatus?: string;
  visibility?: string;
  pinned?: string;
  aiSummary?: string;
  signals?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminDiscussionsPageData {
  filters: {
    q: string;
    kind: string;
    status: string;
    contentStatus: string;
    visibility: string;
    pinned: string;
    aiSummary: string;
    signals: string;
    sort: string;
    page: number;
    pageSize: number;
  };
  summary: {
    total: number;
    hiddenOrRemoved: number;
    pinned: number;
    flagged: number;
    pendingAiSummaries: number;
  };
  pagination: {
    total: number;
    totalPages: number;
    start: number;
    end: number;
  };
  rows: Array<{
    id: string;
    slug: string;
    title: string;
    kind: DiscussionType;
    status: DiscussionStatus;
    contentStatus: ContentStatus;
    visibility: ContentVisibility;
    authorName: string;
    organizationName: string | null;
    categoryName: string;
    regionName: string | null;
    relatedCaseTitle: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
    answerCount: number;
    reactionCount: number;
    commentCount: number;
    bookmarkCount: number;
    followerCount: number;
    viewCount: number;
    boostCount: number;
    score: number;
    isPinned: boolean;
    acceptedAnswerId: string | null;
    aiSummaryStatus: SummaryStatus | null;
    openReports: number;
    openAlerts: number;
  }>;
}

export interface AdminDiscussionDetailData {
  discussion: {
    id: string;
    slug: string;
    title: string;
    body: string;
    excerpt: string | null;
    kind: DiscussionType;
    status: DiscussionStatus;
    contentStatus: ContentStatus;
    visibility: ContentVisibility;
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;
    resolvedAt: Date | null;
    closedAt: Date | null;
    lockedAt: Date | null;
    isPinned: boolean;
    pinnedUntil: Date | null;
    score: number;
    answerCount: number;
    reactionCount: number;
    commentCount: number;
    viewCount: number;
    followerCount: number;
    bookmarkCount: number;
    boostCount: number;
    authorName: string;
    authorId: string;
    organizationName: string | null;
    categoryName: string;
    regionName: string | null;
    relatedCaseTitle: string | null;
    relatedCaseSlug: string | null;
    acceptedAnswerId: string | null;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
  }>;
  attachments: Array<{
    id: string;
    caption: string | null;
    fileName: string;
    mimeType: string | null;
    scanStatus: string;
    isPublic: boolean;
  }>;
  summaries: Array<{
    id: string;
    version: number;
    status: SummaryStatus;
    isCurrent: boolean;
    mainIssue: string | null;
    expertConsensus: string | null;
    summaryText: string | null;
    generatedAt: Date | null;
    modelName: string | null;
    errorMessage: string | null;
  }>;
  revisions: Array<{
    id: string;
    version: number;
    editor: string;
    changeSummary: string | null;
    createdAt: Date;
  }>;
  answers: Array<{
    id: string;
    body: string;
    status: ContentStatus;
    isAccepted: boolean;
    isExpertAnswer: boolean;
    score: number;
    reactionCount: number;
    commentCount: number;
    createdAt: Date;
    authorName: string;
    openReports: number;
    openAlerts: number;
  }>;
  comments: Array<{
    id: string;
    body: string;
    status: ContentStatus;
    score: number;
    reactionCount: number;
    createdAt: Date;
    authorName: string;
    parentType: "discussion" | "answer";
    parentId: string | null;
    openReports: number;
    openAlerts: number;
  }>;
  moderation: {
    reports: Array<{
      id: string;
      reason: string;
      status: ReportStatus;
      reporterName: string;
      reviewedAt: Date | null;
      resolutionNote: string | null;
      createdAt: Date;
    }>;
    alerts: Array<{
      id: string;
      severity: string;
      status: AIAlertStatus;
      source: string;
      title: string;
      detectedAt: Date;
      reviewedAt: Date | null;
    }>;
    actions: Array<{
      id: string;
      actionType: string;
      reason: string | null;
      note: string | null;
      moderator: string;
      createdAt: Date;
    }>;
  };
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: Date;
  }>;
}

export async function getAdminDiscussionsPageData(filters: AdminDiscussionsFilters = {}): Promise<AdminDiscussionsPageData> {
  const q = filters.q?.trim() ?? "";
  const kind = filters.kind?.trim().toUpperCase() ?? "";
  const status = filters.status?.trim().toUpperCase() ?? "";
  const contentStatus = filters.contentStatus?.trim().toUpperCase() ?? "";
  const visibility = filters.visibility?.trim().toUpperCase() ?? "";
  const pinned = filters.pinned?.trim().toLowerCase() ?? "";
  const aiSummary = filters.aiSummary?.trim().toLowerCase() ?? "";
  const signals = filters.signals?.trim().toLowerCase() ?? "";
  const sort = normalizeSort(filters.sort?.trim().toLowerCase() ?? "");
  const page = toPage(filters.page);
  const pageSize = toPageSize(filters.pageSize);
  const realDiscussionUserWhere = buildRealDiscussionUserWhere();

  const where: Prisma.DiscussionWhereInput = {
    AND: [{ author: { is: realDiscussionUserWhere } }],
  };

  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { author: { displayName: { contains: q, mode: "insensitive" } } },
      { author: { profile: { is: { username: { contains: q, mode: "insensitive" } } } } },
      { organization: { is: { name: { contains: q, mode: "insensitive" } } } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { region: { is: { name: { contains: q, mode: "insensitive" } } } },
      { relatedCase: { is: { title: { contains: q, mode: "insensitive" } } } },
      { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
    ];
  }

  if (kind && Object.values(DiscussionType).includes(kind as DiscussionType)) {
    where.kind = kind as DiscussionType;
  }

  if (status && Object.values(DiscussionStatus).includes(status as DiscussionStatus)) {
    where.status = status as DiscussionStatus;
  }

  if (contentStatus && Object.values(ContentStatus).includes(contentStatus as ContentStatus)) {
    where.contentStatus = contentStatus as ContentStatus;
  }

  if (visibility && Object.values(ContentVisibility).includes(visibility as ContentVisibility)) {
    where.visibility = visibility as ContentVisibility;
  }

  if (pinned === "yes") {
    where.isPinned = true;
  } else if (pinned === "no") {
    where.isPinned = false;
  }

  if (aiSummary === "pending") {
    where.aiSummaries = { some: { isCurrent: true, status: SummaryStatus.PENDING } };
  } else if (aiSummary === "failed") {
    where.aiSummaries = { some: { isCurrent: true, status: SummaryStatus.FAILED } };
  } else if (aiSummary === "stale") {
    where.aiSummaries = { some: { isCurrent: true, status: SummaryStatus.STALE } };
  } else if (aiSummary === "generated") {
    where.aiSummaries = { some: { isCurrent: true, status: SummaryStatus.GENERATED } };
  } else if (aiSummary === "missing") {
    where.aiSummaries = { none: { isCurrent: true } };
  }

  if (signals === "flagged") {
    where.OR = [
      ...(where.OR ?? []),
      { reports: { some: { status: { in: OPEN_REPORT_STATUSES } } } },
      { aiAlerts: { some: { status: { in: OPEN_ALERT_STATUSES } } } },
    ];
  }

  let orderBy: Prisma.DiscussionOrderByWithRelationInput[] = [{ lastActivityAt: "desc" }];

  if (sort === "newest") {
    orderBy = [{ createdAt: "desc" }];
  } else if (sort === "most_viewed") {
    orderBy = [{ viewCount: "desc" }, { lastActivityAt: "desc" }];
  } else if (sort === "most_answered") {
    orderBy = [{ answerCount: "desc" }, { lastActivityAt: "desc" }];
  } else if (sort === "most_reacted") {
    orderBy = [{ reactionCount: "desc" }, { lastActivityAt: "desc" }];
  } else if (sort === "oldest_unresolved") {
    where.status = DiscussionStatus.OPEN;
    orderBy = [{ createdAt: "asc" }];
  }

  const [total, hiddenOrRemoved, pinnedCount, flaggedCount, pendingAiSummaries, rows] = await Promise.all([
    prisma.discussion.count({ where }),
    prisma.discussion.count({
      where: {
        AND: [{ author: { is: realDiscussionUserWhere } }],
        OR: [{ status: DiscussionStatus.HIDDEN }, { contentStatus: { in: [ContentStatus.HIDDEN, ContentStatus.REMOVED] } }],
      },
    }),
    prisma.discussion.count({ where: { AND: [{ author: { is: realDiscussionUserWhere } }], isPinned: true } }),
    prisma.discussion.count({
      where: {
        AND: [{ author: { is: realDiscussionUserWhere } }],
        OR: [
          { reports: { some: { status: { in: OPEN_REPORT_STATUSES } } } },
          { aiAlerts: { some: { status: { in: OPEN_ALERT_STATUSES } } } },
        ],
      },
    }),
    prisma.discussionAISummary.count({
      where: {
        discussion: { author: realDiscussionUserWhere },
        isCurrent: true,
        status: SummaryStatus.PENDING,
      },
    }),
    prisma.discussion.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        kind: true,
        status: true,
        contentStatus: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        lastActivityAt: true,
        answerCount: true,
        reactionCount: true,
        commentCount: true,
        bookmarkCount: true,
        followerCount: true,
        viewCount: true,
        boostCount: true,
        score: true,
        isPinned: true,
        acceptedAnswerId: true,
        author: { select: { displayName: true } },
        organization: { select: { name: true } },
        category: { select: { name: true } },
        region: { select: { name: true } },
        relatedCase: { select: { title: true } },
        aiSummaries: {
          where: { isCurrent: true },
          take: 1,
          select: { status: true },
        },
        reports: {
          where: { status: { in: OPEN_REPORT_STATUSES } },
          select: { id: true },
        },
        aiAlerts: {
          where: { status: { in: OPEN_ALERT_STATUSES } },
          select: { id: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, start + rows.length - 1);

  return {
    filters: {
      q,
      kind,
      status,
      contentStatus,
      visibility,
      pinned,
      aiSummary,
      signals,
      sort,
      page,
      pageSize,
    },
    summary: {
      total,
      hiddenOrRemoved,
      pinned: pinnedCount,
      flagged: flaggedCount,
      pendingAiSummaries,
    },
    pagination: {
      total,
      totalPages,
      start,
      end,
    },
    rows: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      kind: row.kind,
      status: row.status,
      contentStatus: row.contentStatus,
      visibility: row.visibility,
      authorName: row.author.displayName ?? "Unknown author",
      organizationName: row.organization?.name ?? null,
      categoryName: row.category.name,
      regionName: row.region?.name ?? null,
      relatedCaseTitle: row.relatedCase?.title ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lastActivityAt: row.lastActivityAt,
      answerCount: row.answerCount,
      reactionCount: row.reactionCount,
      commentCount: row.commentCount,
      bookmarkCount: row.bookmarkCount,
      followerCount: row.followerCount,
      viewCount: row.viewCount,
      boostCount: row.boostCount,
      score: row.score,
      isPinned: row.isPinned,
      acceptedAnswerId: row.acceptedAnswerId,
      aiSummaryStatus: row.aiSummaries[0]?.status ?? null,
      openReports: row.reports.length,
      openAlerts: row.aiAlerts.length,
    })),
  };
}

export async function getAdminDiscussionDetailData(slug: string): Promise<AdminDiscussionDetailData | null> {
  const realDiscussionUserWhere = buildRealDiscussionUserWhere();
  const discussion = await prisma.discussion.findFirst({
    where: {
      slug,
      author: {
        is: realDiscussionUserWhere,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      excerpt: true,
      kind: true,
      status: true,
      contentStatus: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
      lastActivityAt: true,
      resolvedAt: true,
      closedAt: true,
      lockedAt: true,
      isPinned: true,
      pinnedUntil: true,
      score: true,
      answerCount: true,
      reactionCount: true,
      commentCount: true,
      viewCount: true,
      followerCount: true,
      bookmarkCount: true,
      boostCount: true,
      acceptedAnswerId: true,
      author: { select: { id: true, displayName: true } },
      organization: { select: { name: true } },
      category: { select: { name: true } },
      region: { select: { name: true } },
      relatedCase: { select: { slug: true, title: true } },
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
            },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          caption: true,
          asset: {
            select: {
              originalFileName: true,
              mimeType: true,
              scanStatus: true,
              isPublic: true,
            },
          },
        },
      },
      aiSummaries: {
        orderBy: [{ isCurrent: "desc" }, { version: "desc" }],
        select: {
          id: true,
          version: true,
          status: true,
          isCurrent: true,
          mainIssue: true,
          expertConsensus: true,
          summaryText: true,
          generatedAt: true,
          modelName: true,
          errorMessage: true,
        },
      },
      revisions: {
        orderBy: { version: "desc" },
        take: 8,
        select: {
          id: true,
          version: true,
          changeSummary: true,
          createdAt: true,
          editor: { select: { displayName: true } },
        },
      },
      answers: {
        orderBy: [{ isAccepted: "desc" }, { score: "desc" }, { createdAt: "asc" }],
        take: 20,
        select: {
          id: true,
          body: true,
          status: true,
          isAccepted: true,
          isExpertAnswer: true,
          score: true,
          reactionCount: true,
          commentCount: true,
          createdAt: true,
          author: { select: { displayName: true } },
          reports: {
            where: { status: { in: OPEN_REPORT_STATUSES } },
            select: { id: true },
          },
          aiAlerts: {
            where: { status: { in: OPEN_ALERT_STATUSES } },
            select: { id: true },
          },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          body: true,
          status: true,
          score: true,
          reactionCount: true,
          createdAt: true,
          answerId: true,
          discussionId: true,
          author: { select: { displayName: true } },
          reports: {
            where: { status: { in: OPEN_REPORT_STATUSES } },
            select: { id: true },
          },
          aiAlerts: {
            where: { status: { in: OPEN_ALERT_STATUSES } },
            select: { id: true },
          },
        },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          reviewedAt: true,
          resolutionNote: true,
          reporter: { select: { displayName: true } },
        },
      },
      aiAlerts: {
        orderBy: { detectedAt: "desc" },
        take: 12,
        select: {
          id: true,
          severity: true,
          status: true,
          source: true,
          title: true,
          detectedAt: true,
          reviewedAt: true,
        },
      },
      moderationActions: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          actionType: true,
          reason: true,
          note: true,
          createdAt: true,
          moderator: { select: { displayName: true } },
        },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          title: true,
          createdAt: true,
        },
      },
    },
  });

  if (!discussion) {
    return null;
  }

  return {
    discussion: {
      id: discussion.id,
      slug: discussion.slug,
      title: discussion.title,
      body: discussion.body,
      excerpt: discussion.excerpt ?? null,
      kind: discussion.kind,
      status: discussion.status,
      contentStatus: discussion.contentStatus,
      visibility: discussion.visibility,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      lastActivityAt: discussion.lastActivityAt,
      resolvedAt: discussion.resolvedAt,
      closedAt: discussion.closedAt,
      lockedAt: discussion.lockedAt,
      isPinned: discussion.isPinned,
      pinnedUntil: discussion.pinnedUntil,
      score: discussion.score,
      answerCount: discussion.answerCount,
      reactionCount: discussion.reactionCount,
      commentCount: discussion.commentCount,
      viewCount: discussion.viewCount,
      followerCount: discussion.followerCount,
      bookmarkCount: discussion.bookmarkCount,
      boostCount: discussion.boostCount,
      authorName: discussion.author.displayName ?? "Unknown author",
      authorId: discussion.author.id,
      organizationName: discussion.organization?.name ?? null,
      categoryName: discussion.category.name,
      regionName: discussion.region?.name ?? null,
      relatedCaseTitle: discussion.relatedCase?.title ?? null,
      relatedCaseSlug: discussion.relatedCase?.slug ?? null,
      acceptedAnswerId: discussion.acceptedAnswerId ?? null,
    },
    tags: discussion.tags.map((item) => ({
      id: item.tag.id,
      name: item.tag.name,
      slug: item.tag.slug,
      type: item.tag.type,
    })),
    attachments: discussion.attachments.map((attachment) => ({
      id: attachment.id,
      caption: attachment.caption ?? null,
      fileName: attachment.asset.originalFileName,
      mimeType: attachment.asset.mimeType ?? null,
      scanStatus: attachment.asset.scanStatus,
      isPublic: attachment.asset.isPublic,
    })),
    summaries: discussion.aiSummaries.map((summary) => ({
      id: summary.id,
      version: summary.version,
      status: summary.status,
      isCurrent: summary.isCurrent,
      mainIssue: summary.mainIssue ?? null,
      expertConsensus: summary.expertConsensus ?? null,
      summaryText: summary.summaryText ?? null,
      generatedAt: summary.generatedAt ?? null,
      modelName: summary.modelName ?? null,
      errorMessage: summary.errorMessage ?? null,
    })),
    revisions: discussion.revisions.map((revision) => ({
      id: revision.id,
      version: revision.version,
      editor: revision.editor.displayName ?? "Unknown editor",
      changeSummary: revision.changeSummary ?? null,
      createdAt: revision.createdAt,
    })),
    answers: discussion.answers.map((answer) => ({
      id: answer.id,
      body: answer.body,
      status: answer.status,
      isAccepted: answer.isAccepted,
      isExpertAnswer: answer.isExpertAnswer,
      score: answer.score,
      reactionCount: answer.reactionCount,
      commentCount: answer.commentCount,
      createdAt: answer.createdAt,
      authorName: answer.author.displayName ?? "Unknown author",
      openReports: answer.reports.length,
      openAlerts: answer.aiAlerts.length,
    })).filter((answer) => !matchesSeededDiscussionIdentity(answer.authorName)),
    comments: discussion.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      status: comment.status,
      score: comment.score,
      reactionCount: comment.reactionCount,
      createdAt: comment.createdAt,
      authorName: comment.author.displayName ?? "Unknown author",
      parentType: comment.answerId ? ("answer" as const) : ("discussion" as const),
      parentId: comment.answerId ?? comment.discussionId ?? null,
      openReports: comment.reports.length,
      openAlerts: comment.aiAlerts.length,
    })).filter((comment) => !matchesSeededDiscussionIdentity(comment.authorName)),
    moderation: {
      reports: discussion.reports.map((report) => ({
        id: report.id,
        reason: prettyText(report.reason),
        status: report.status,
        reporterName: report.reporter.displayName ?? "Unknown reporter",
        reviewedAt: report.reviewedAt ?? null,
        resolutionNote: report.resolutionNote ?? null,
        createdAt: report.createdAt,
      })).filter((report) => !matchesSeededDiscussionIdentity(report.reporterName)),
      alerts: discussion.aiAlerts.map((alert) => ({
        id: alert.id,
        severity: prettyText(alert.severity),
        status: alert.status,
        source: alert.source,
        title: alert.title,
        detectedAt: alert.detectedAt,
        reviewedAt: alert.reviewedAt ?? null,
      })),
      actions: discussion.moderationActions.map((action) => ({
        id: action.id,
        actionType: prettyText(action.actionType),
        reason: action.reason ?? null,
        note: action.note ?? null,
        moderator: action.moderator.displayName ?? "Unknown moderator",
        createdAt: action.createdAt,
      })).filter((action) => !matchesSeededDiscussionIdentity(action.moderator)),
    },
    notifications: discussion.notifications.map((notification) => ({
      id: notification.id,
      type: prettyText(notification.type),
      title: notification.title,
      createdAt: notification.createdAt,
    })),
  };
}
