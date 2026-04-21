import { prisma } from '@/lib/prisma';
import { Prisma, RepositoryItemStatus } from '@prisma/client';
import type { CaseCommentItem, CaseReactionType, CaseRepositoryRecord, CaseSourceType, CaseVisibility } from '@/types/case';

export interface CreateCaseDraftInput {
  title: string;
  canonicalCitation?: string;
  docketNumber?: string;
  summary?: string;
  facts?: string;
  issues?: string;
  holding?: string;
  outcome?: string;
  proceduralHistory?: string;
  categorySlug: string;
  tagSlugs?: string[];
  regionSlug?: string;
  courtSlug?: string;
  organizationId?: string;
  visibility?: CaseVisibility;
  sourceType?: CaseSourceType;
  sourceLinks?: Array<{ label?: string; sourceName?: string; url: string }>;
  citations?: string[];
  intent?: 'draft' | 'submit';
}

const caseRecordInclude = {
  author: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      identifiers: {
        where: { type: 'EMAIL', isPrimary: true },
        select: { value: true },
        take: 1,
      },
      lawyerProfile: {
        select: {
          verificationStatus: true,
          firmName: true,
        },
      },
    },
  },
  reviewedBy: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      identifiers: {
        where: { type: 'EMAIL', isPrimary: true },
        select: { value: true },
        take: 1,
      },
    },
  },
  organization: { select: { id: true, name: true } },
  category: { select: { id: true, slug: true, name: true, colorHex: true } },
  tags: { include: { tag: { select: { id: true, slug: true, name: true } } } },
  region: { select: { id: true, slug: true, name: true } },
  court: { select: { id: true, slug: true, name: true, level: true } },
  sourceLinks: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
  sourceFiles: {
    include: {
      asset: {
        select: {
          id: true,
          originalFileName: true,
          mimeType: true,
          fileSize: true,
          createdAt: true,
        },
      },
    },
  },
  bookmarks: { select: { userId: true } },
  followers: { select: { userId: true } },
  reactions: { select: { userId: true, reactionType: true } },
  revisions: {
    include: {
      editor: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          identifiers: {
            where: { type: 'EMAIL', isPrimary: true },
            select: { value: true },
            take: 1,
          },
          lawyerProfile: { select: { verificationStatus: true } },
        },
      },
      reviewedBy: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          identifiers: {
            where: { type: 'EMAIL', isPrimary: true },
            select: { value: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { version: 'desc' },
  },
  citationsMade: {
    include: {
      citedCase: {
        select: {
          slug: true,
          title: true,
          canonicalCitation: true,
          decisionDate: true,
          court: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  citationsReceived: {
    include: {
      sourceCase: {
        select: {
          slug: true,
          title: true,
          canonicalCitation: true,
          decisionDate: true,
          court: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  comments: {
    where: { parentId: null, deletedAt: null },
    include: {
      author: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          identifiers: {
            where: { type: 'EMAIL', isPrimary: true },
            select: { value: true },
            take: 1,
          },
          lawyerProfile: { select: { verificationStatus: true } },
        },
      },
      reactions: { select: { reactionType: true } },
      replies: {
        where: { deletedAt: null },
        include: {
          author: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              identifiers: {
                where: { type: 'EMAIL', isPrimary: true },
                select: { value: true },
                take: 1,
              },
              lawyerProfile: { select: { verificationStatus: true } },
            },
          },
          reactions: { select: { reactionType: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
  reports: { select: { id: true } },
  aiAlerts: { select: { id: true } },
  discussionThreads: {
    select: {
      id: true,
      slug: true,
      title: true,
      answerCount: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  },
} satisfies Prisma.CaseRecordInclude;

type CaseRecordWithRelations = Prisma.CaseRecordGetPayload<{ include: typeof caseRecordInclude }>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base: string) {
  const normalized = slugify(base) || `case-${Date.now()}`;
  let candidate = normalized;
  let counter = 1;

  while (await prisma.caseRecord.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${normalized}-${counter++}`;
  }

  return candidate;
}

function bytesLabel(size?: number | null) {
  if (!size) return 'Unknown size';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function toCaseReactionType(value?: string | null): CaseReactionType | null {
  if (value === 'LIKE' || value === 'UPVOTE' || value === 'DOWNVOTE' || value === 'HELPFUL' || value === 'INSIGHTFUL') {
    return value;
  }
  return null;
}

function buildCommentNode(comment: CaseRecordWithRelations['comments'][number]): CaseCommentItem {
  const tally = (reactions: Array<{ reactionType: string }>) => {
    const map = new Map<string, number>();
    for (const reaction of reactions) {
      map.set(reaction.reactionType, (map.get(reaction.reactionType) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([type, count]) => ({
      type: type as CaseCommentItem['reactions'][number]['type'],
      count,
    }));
  };

  return {
    id: comment.id,
    author: {
      id: comment.author.id,
      displayName: comment.author.displayName ?? 'Legal Hub User',
      email: comment.author.identifiers[0]?.value ?? null,
      avatarUrl: comment.author.avatarUrl,
      isVerifiedLawyer: comment.author.lawyerProfile?.verificationStatus === 'VERIFIED',
    },
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.updatedAt.getTime() !== comment.createdAt.getTime() ? comment.updatedAt.toISOString() : null,
    reactions: tally(comment.reactions),
    replies: comment.replies.map((reply) =>
      ({
        id: reply.id,
        author: {
          id: reply.author.id,
          displayName: reply.author.displayName ?? 'Legal Hub User',
          email: reply.author.identifiers[0]?.value ?? null,
          avatarUrl: reply.author.avatarUrl,
          isVerifiedLawyer: reply.author.lawyerProfile?.verificationStatus === 'VERIFIED',
        },
        body: reply.body,
        createdAt: reply.createdAt.toISOString(),
        editedAt: reply.updatedAt.getTime() !== reply.createdAt.getTime() ? reply.updatedAt.toISOString() : null,
        reactions: tally(reply.reactions),
      }) satisfies CaseCommentItem,
    ),
  };
}

export function mapCaseRecord(record: CaseRecordWithRelations, viewerId?: string | null): CaseRepositoryRecord {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    canonicalCitation: record.canonicalCitation ?? 'Citation pending',
    summary: record.summary ?? 'Summary not yet provided.',
    facts: record.facts ?? 'Facts not yet documented.',
    issues: record.issues ?? 'Issues not yet documented.',
    holding: record.holding ?? 'Holding not yet documented.',
    outcome: record.outcome ?? 'Outcome not yet documented.',
    proceduralHistory: record.proceduralHistory ?? 'Procedural history not yet documented.',
    docketNumber: record.docketNumber ?? null,
    category: {
      id: record.category.slug,
      name: record.category.name,
      colorHex: record.category.colorHex,
    },
    tags: record.tags.map((item) => ({ id: item.tag.slug, name: item.tag.name })),
    region: record.region ? { id: record.region.slug, name: record.region.name } : null,
    court: record.court
      ? {
          id: record.court.slug,
          name: record.court.name,
          level: record.court.level,
        }
      : null,
    status: record.status,
    visibility: record.visibility,
    sourceType: record.sourceType,
    author: {
      id: record.author.id,
      displayName: record.author.displayName ?? 'Legal Hub User',
      email: record.author.identifiers[0]?.value ?? null,
      avatarUrl: record.author.avatarUrl,
      organizationName: record.organization?.name ?? record.author.lawyerProfile?.firmName ?? null,
      isVerifiedLawyer: record.author.lawyerProfile?.verificationStatus === 'VERIFIED',
    },
    organization: record.organization,
    decisionDate: record.decisionDate?.toISOString() ?? null,
    filedDate: record.filedDate?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    publishedAt: record.publishedAt?.toISOString() ?? null,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    trustLabel:
      record.sourceType === 'OFFICIAL_COURT'
        ? 'Verified from official court material'
        : record.status === 'PUBLISHED'
          ? 'Published after repository review'
          : 'Contributor draft awaiting repository review',
    provenanceLabel:
      record.sourceLinks.length > 0
        ? `${record.sourceLinks.length} linked source${record.sourceLinks.length === 1 ? '' : 's'}`
        : 'No source links attached yet',
    counts: {
      views: record.viewCount,
      comments: record.commentCount,
      saves: record.bookmarkCount,
      follows: record.followerCount,
      reactions: record.reactionCount,
      outboundCitations: record.citationsMade.length,
      inboundCitations: record.citationsReceived.length,
    },
    viewerState: {
      saved: viewerId ? record.bookmarks.some((bookmark) => bookmark.userId === viewerId) : false,
      followed: viewerId ? record.followers.some((follow) => follow.userId === viewerId) : false,
      reaction: viewerId ? toCaseReactionType(record.reactions.find((reaction) => reaction.userId === viewerId)?.reactionType) : null,
    },
    sourceLinks: record.sourceLinks.map((link) => ({
      id: link.id,
      label: link.label ?? link.sourceName ?? 'Source link',
      sourceName: link.sourceName ?? 'External source',
      url: link.url,
      publishedAt: link.publishedAt?.toISOString() ?? null,
      isPrimary: link.isPrimary,
    })),
    sourceFiles: record.sourceFiles.map((file) => ({
      id: file.id,
      label: file.label ?? file.asset.originalFileName,
      filename: file.asset.originalFileName,
      fileType: file.asset.mimeType ?? 'Unknown',
      fileSizeLabel: bytesLabel(file.asset.fileSize),
      uploadedAt: file.createdAt.toISOString(),
    })),
    revisions: record.revisions.map((revision) => ({
      id: revision.id,
      version: revision.version,
      status: revision.status,
      createdAt: revision.createdAt.toISOString(),
      changeSummary: revision.changeSummary ?? 'Revision saved without summary.',
      editor: {
        id: revision.editor.id,
        displayName: revision.editor.displayName ?? 'Legal Hub User',
        email: revision.editor.identifiers[0]?.value ?? null,
        avatarUrl: revision.editor.avatarUrl,
        isVerifiedLawyer: revision.editor.lawyerProfile?.verificationStatus === 'VERIFIED',
      },
      reviewedBy: revision.reviewedBy
        ? {
            id: revision.reviewedBy.id,
            displayName: revision.reviewedBy.displayName ?? 'Reviewer',
            email: revision.reviewedBy.identifiers[0]?.value ?? null,
            avatarUrl: revision.reviewedBy.avatarUrl,
          }
        : null,
    })),
    citationsMade: record.citationsMade.map((citation) => ({
      id: citation.id,
      slug: citation.citedCase.slug,
      title: citation.citedCase.title,
      canonicalCitation: citation.citedCase.canonicalCitation ?? 'Citation pending',
      court: citation.citedCase.court?.name ?? null,
      decisionDate: citation.citedCase.decisionDate?.toISOString() ?? null,
      relationshipLabel: 'Cited by this case',
      note: citation.citationText ?? null,
    })),
    citationsReceived: record.citationsReceived.map((citation) => ({
      id: citation.id,
      slug: citation.sourceCase.slug,
      title: citation.sourceCase.title,
      canonicalCitation: citation.sourceCase.canonicalCitation ?? 'Citation pending',
      court: citation.sourceCase.court?.name ?? null,
      decisionDate: citation.sourceCase.decisionDate?.toISOString() ?? null,
      relationshipLabel: 'Cites this case',
      note: citation.citationText ?? null,
    })),
    comments: record.comments.map(buildCommentNode),
    relatedDiscussions: record.discussionThreads.map((discussion) => ({
      id: discussion.id,
      slug: discussion.slug,
      title: discussion.title,
      answerCount: discussion.answerCount,
      updatedAt: discussion.updatedAt.toISOString(),
    })),
    moderation: {
      openReports: record.reports.length,
      aiAlerts: record.aiAlerts.length,
      lastReviewerNote: record.revisions.find((revision) => revision.reviewedBy)?.changeSummary ?? null,
    },
  };
}

export async function listCaseRecords(params: {
  viewerId?: string | null;
  authorId?: string | null;
  includeViewerDrafts?: boolean;
  statuses?: RepositoryItemStatus[];
}) {
  const where: Prisma.CaseRecordWhereInput = {
    deletedAt: null,
  };

  if (params.statuses?.length) {
    where.status = { in: params.statuses };
  } else if (params.authorId) {
    where.authorId = params.authorId;
  } else if (params.includeViewerDrafts && params.viewerId) {
    where.OR = [{ status: 'PUBLISHED' }, { authorId: params.viewerId }];
  } else {
    where.status = 'PUBLISHED';
  }

  const records = await prisma.caseRecord.findMany({
    where,
    include: {
      ...caseRecordInclude,
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  return records.map((record) => mapCaseRecord(record as CaseRecordWithRelations, params.viewerId));
}

export async function findCaseRecordBySlug(slug: string, viewerId?: string | null) {
  const record = await prisma.caseRecord.findUnique({
    where: { slug },
    include: {
      ...caseRecordInclude,
    },
  });

  if (!record) return null;
  return mapCaseRecord(record as CaseRecordWithRelations, viewerId);
}

export async function getCaseRepositoryMeta(viewerId?: string | null) {
  const [categoryRows, tagRows, regionRows, courtRows, organizationRows] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { slug: true, name: true },
    }),
    prisma.tag.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      take: 24,
      select: { slug: true, name: true },
    }),
    prisma.region.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 20,
      select: { slug: true, name: true },
    }),
    prisma.court.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true, level: true },
    }),
    viewerId
      ? prisma.organization.findMany({
          where: {
            OR: [{ ownerId: viewerId }, { members: { some: { userId: viewerId, status: 'ACTIVE' } } }],
          },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    categories: categoryRows.map((item) => ({ id: item.slug, name: item.name })),
    tags: tagRows.map((item) => ({ id: item.slug, name: item.name })),
    regions: regionRows.map((item) => ({ id: item.slug, name: item.name })),
    courts: courtRows.map((item) => ({ id: item.slug, name: item.name, level: item.level })),
    organizations: organizationRows,
  };
}

export async function createCaseDraft(authorId: string, input: CreateCaseDraftInput) {
  const category = await prisma.category.findUnique({
    where: { slug: input.categorySlug },
    select: { id: true, name: true },
  });

  if (!category) {
    throw new Error('Selected category was not found.');
  }

  const [region, court, organization, tagRows] = await Promise.all([
    input.regionSlug
      ? prisma.region.findUnique({ where: { slug: input.regionSlug }, select: { id: true, slug: true, name: true } })
      : Promise.resolve(null),
    input.courtSlug
      ? prisma.court.findUnique({ where: { slug: input.courtSlug }, select: { id: true, slug: true, name: true } })
      : Promise.resolve(null),
    input.organizationId
      ? prisma.organization.findUnique({ where: { id: input.organizationId }, select: { id: true } })
      : Promise.resolve(null),
    input.tagSlugs?.length
      ? prisma.tag.findMany({ where: { slug: { in: input.tagSlugs } }, select: { id: true, slug: true } })
      : Promise.resolve([]),
  ]);

  const cleanLinks = (input.sourceLinks ?? [])
    .map((item) => ({
      label: item.label?.trim() || null,
      sourceName: item.sourceName?.trim() || null,
      url: item.url.trim(),
    }))
    .filter((item) => item.url.length > 0);

  const cleanCitation = input.canonicalCitation?.trim() || null;
  const cleanTitle = input.title.trim();

  if (!cleanTitle) {
    throw new Error('Case title is required.');
  }

  if (cleanCitation) {
    const existingCitation = await prisma.caseRecord.findUnique({
      where: { canonicalCitation: cleanCitation },
      select: { slug: true, title: true },
    });

    if (existingCitation) {
      throw new Error(
        `Canonical citation "${cleanCitation}" already exists on "${existingCitation.title}". Change the citation or open the existing case.`,
      );
    }
  }

  const slug = await uniqueSlug(cleanTitle);
  const status: RepositoryItemStatus = input.intent === 'submit' ? 'PENDING_REVIEW' : 'DRAFT';
  const versionStatus: RepositoryItemStatus = status;

  const created = await prisma.caseRecord.create({
    data: {
      slug,
      title: cleanTitle,
      canonicalCitation: cleanCitation,
      docketNumber: input.docketNumber?.trim() || null,
      summary: input.summary?.trim() || null,
      facts: input.facts?.trim() || null,
      issues: input.issues?.trim() || null,
      holding: input.holding?.trim() || null,
      outcome: input.outcome?.trim() || null,
      proceduralHistory: input.proceduralHistory?.trim() || null,
      sourceType: input.sourceType ?? 'USER_SUBMITTED',
      visibility: input.visibility ?? 'PUBLIC',
      status,
      authorId,
      organizationId: organization?.id ?? null,
      primaryCategoryId: category.id,
      regionId: region?.id ?? null,
      courtId: court?.id ?? null,
      sourceCount: cleanLinks.length,
      revisionCount: 1,
      sourceLinks: cleanLinks.length
        ? {
            create: cleanLinks.map((item, index) => ({
              label: item.label,
              sourceName: item.sourceName,
              url: item.url,
              isPrimary: index === 0,
            })),
          }
        : undefined,
      tags: tagRows.length
        ? {
            create: tagRows.map((tag) => ({
              tagId: tag.id,
            })),
          }
        : undefined,
      revisions: {
        create: {
          version: 1,
          editorId: authorId,
          status: versionStatus,
          changeSummary: input.intent === 'submit' ? 'Initial case draft submitted for review.' : 'Initial case draft created.',
          snapshot: {
            title: cleanTitle,
            canonicalCitation: cleanCitation,
            summary: input.summary?.trim() || null,
            facts: input.facts?.trim() || null,
            issues: input.issues?.trim() || null,
            holding: input.holding?.trim() || null,
            outcome: input.outcome?.trim() || null,
            proceduralHistory: input.proceduralHistory?.trim() || null,
            categorySlug: input.categorySlug,
            tagSlugs: input.tagSlugs ?? [],
            regionSlug: input.regionSlug ?? null,
            courtSlug: input.courtSlug ?? null,
            sourceLinks: cleanLinks,
            citations: input.citations ?? [],
          },
        },
      },
    },
    include: {
      ...caseRecordInclude,
    },
  });

  return mapCaseRecord(created as CaseRecordWithRelations, authorId);
}
