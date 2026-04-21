import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FEATURED_GRADIENTS = [
  'linear-gradient(135deg, #63318C 0%, #EA496C 100%)',
  'linear-gradient(135deg, #3984F4 0%, #06B5D4 100%)',
  'linear-gradient(135deg, #4C2F5E 0%, #9F63C4 100%)',
  'linear-gradient(135deg, #005C57 0%, #00C2B7 100%)',
];

export async function GET() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      activeDiscussionCount,
      verifiedLawyerCount,
      activeRegionCount,
      aiSummaryCount,
      topLawyersRaw,
      trendingTagsRaw,
      regionsRaw,
      featuredRaw,
      focusCategoriesRaw,
    ] = await Promise.all([
      prisma.discussion.count({
        where: {
          contentStatus: 'ACTIVE',
          visibility: 'PUBLIC',
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          lawyerProfile: {
            verificationStatus: 'VERIFIED',
          },
        },
      }),
      prisma.region.count({
        where: {
          isActive: true,
          discussions: {
            some: {
              createdAt: { gte: monthAgo },
              contentStatus: 'ACTIVE',
              visibility: 'PUBLIC',
              deletedAt: null,
            },
          },
        },
      }),
      prisma.discussion.count({
        where: {
          contentStatus: 'ACTIVE',
          visibility: 'PUBLIC',
          deletedAt: null,
          isAiSummaryReady: true,
        },
      }),
      prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          lawyerProfile: {
            verificationStatus: 'VERIFIED',
          },
          OR: [
            {
              answers: {
                some: {
                  createdAt: { gte: monthAgo },
                  status: 'ACTIVE',
                },
              },
            },
            {
              discussions: {
                some: {
                  createdAt: { gte: monthAgo },
                  contentStatus: 'ACTIVE',
                },
              },
            },
          ],
        },
        take: 24,
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          profile: {
            select: {
              primaryRegion: { select: { name: true } },
            },
          },
          lawyerProfile: {
            select: {
              verificationStatus: true,
              firmName: true,
              practiceAreas: {
                where: { isPrimary: true },
                take: 1,
                select: { category: { select: { name: true } } },
              },
            },
          },
          gamification: {
            select: {
              totalPoints: true,
            },
          },
          stats: {
            select: {
              acceptedAnswerCount: true,
              reactionReceivedCount: true,
            },
          },
          _count: {
            select: {
              answers: {
                where: {
                  createdAt: { gte: monthAgo },
                  status: 'ACTIVE',
                },
              },
              discussions: {
                where: {
                  createdAt: { gte: monthAgo },
                  contentStatus: 'ACTIVE',
                },
              },
            },
          },
        },
      }),
      prisma.tag.findMany({
        where: {
          isActive: true,
          discussions: {
            some: {
              discussion: {
                createdAt: { gte: weekAgo },
                contentStatus: 'ACTIVE',
              },
            },
          },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              discussions: {
                where: {
                  discussion: {
                    createdAt: { gte: weekAgo },
                    contentStatus: 'ACTIVE',
                  },
                },
              },
            },
          },
          discussions: {
            where: {
              discussion: {
                createdAt: { gte: twoWeeksAgo, lt: weekAgo },
                contentStatus: 'ACTIVE',
              },
            },
            select: { id: true },
          },
        },
      }),
      prisma.region.findMany({
        where: {
          isActive: true,
          discussions: {
            some: {
              createdAt: { gte: weekAgo },
              contentStatus: 'ACTIVE',
              visibility: 'PUBLIC',
              deletedAt: null,
            },
          },
        },
        take: 6,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          _count: {
            select: {
              discussions: {
                where: {
                  createdAt: { gte: weekAgo },
                  contentStatus: 'ACTIVE',
                  deletedAt: null,
                },
              },
            },
          },
          discussions: {
            where: {
              createdAt: { gte: weekAgo },
              contentStatus: 'ACTIVE',
              deletedAt: null,
            },
            select: {
              category: { select: { name: true } },
            },
            take: 50,
          },
        },
      }),
      prisma.discussion.findMany({
        where: {
          contentStatus: 'ACTIVE',
          visibility: 'PUBLIC',
          createdAt: { gte: monthAgo },
          deletedAt: null,
        },
        take: 20,
        orderBy: [
          { answerCount: 'desc' },
          { reactionCount: 'desc' },
          { viewCount: 'desc' },
        ],
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          kind: true,
          score: true,
          answerCount: true,
          reactionCount: true,
          viewCount: true,
          isAiSummaryReady: true,
          createdAt: true,
          author: {
            select: {
              displayName: true,
              avatarUrl: true,
              lawyerProfile: {
                select: { verificationStatus: true },
              },
            },
          },
          category: {
            select: { name: true, colorHex: true, slug: true },
          },
          region: {
            select: { name: true },
          },
        },
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          scope: { in: ['DISCUSSION', 'BOTH'] },
          discussions: {
            some: {
              contentStatus: 'ACTIVE',
              visibility: 'PUBLIC',
              deletedAt: null,
            },
          },
        },
        take: 12,
        select: {
          id: true,
          name: true,
          slug: true,
          colorHex: true,
          iconName: true,
          _count: {
            select: {
              discussions: {
                where: {
                  contentStatus: 'ACTIVE',
                  visibility: 'PUBLIC',
                  deletedAt: null,
                },
              },
            },
          },
          discussions: {
            where: {
              createdAt: { gte: monthAgo },
              contentStatus: 'ACTIVE',
              visibility: 'PUBLIC',
              deletedAt: null,
            },
            select: {
              answerCount: true,
              isAiSummaryReady: true,
            },
            take: 60,
          },
        },
      }),
    ]);

    const communityBrief = {
      activeDiscussions: activeDiscussionCount,
      verifiedLawyers: verifiedLawyerCount,
      activeRegions: activeRegionCount,
      aiSummaries: aiSummaryCount,
    };

    const topLawyers = topLawyersRaw
      .map((user) => ({
        id: user.id,
        name: user.displayName ?? 'Anonymous',
        avatarUrl: user.avatarUrl,
        practiceArea: user.lawyerProfile?.practiceAreas?.[0]?.category?.name ?? 'General Practice',
        firmName: user.lawyerProfile?.firmName ?? null,
        region: user.profile?.primaryRegion?.name ?? null,
        score:
          (user.gamification?.totalPoints ?? 0) +
          user._count.answers * 12 +
          user._count.discussions * 6 +
          (user.stats?.acceptedAnswerCount ?? 0) * 15 +
          (user.stats?.reactionReceivedCount ?? 0) * 2,
        monthlyCount: user._count.answers + user._count.discussions,
        isVerified: user.lawyerProfile?.verificationStatus === 'VERIFIED',
      }))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return right.monthlyCount - left.monthlyCount;
      })
      .slice(0, 20);

    const trendingTopics = trendingTagsRaw
      .map((tag) => {
        const thisWeek = tag._count.discussions;
        const lastWeek = tag.discussions.length;
        const pctChange =
          lastWeek === 0 ? thisWeek * 100 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

        return {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          thisWeek,
          pctChange,
          trend: pctChange >= 0 ? `+${pctChange}%` : `${pctChange}%`,
          isPositive: pctChange >= 0,
        };
      })
      .sort((left, right) => right.thisWeek - left.thisWeek)
      .slice(0, 5);

    const regionalHotTopics = regionsRaw
      .map((region) => {
        const categoryCounts: Record<string, number> = {};

        for (const discussion of region.discussions) {
          const name = discussion.category.name;
          categoryCounts[name] = (categoryCounts[name] ?? 0) + 1;
        }

        const topCategory =
          Object.entries(categoryCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? 'General';

        return {
          id: region.id,
          name: region.name,
          slug: region.slug,
          type: region.type,
          discussionCount: region._count.discussions,
          topCategory,
        };
      })
      .sort((left, right) => right.discussionCount - left.discussionCount)
      .slice(0, 4);

    const featuredDiscussions = featuredRaw
      .map((discussion) => ({
        ...discussion,
        engagementScore:
          discussion.answerCount * 3 +
          discussion.reactionCount * 2 +
          Math.floor(discussion.viewCount * 0.1) +
          discussion.score,
      }))
      .sort((left, right) => right.engagementScore - left.engagementScore)
      .slice(0, 4)
      .map((discussion, index) => ({
        id: discussion.id,
        slug: discussion.slug,
        title: discussion.title,
        excerpt: discussion.excerpt,
        kind: discussion.kind,
        answerCount: discussion.answerCount,
        reactionCount: discussion.reactionCount,
        viewCount: discussion.viewCount,
        isAiSummaryReady: discussion.isAiSummaryReady,
        createdAt: discussion.createdAt,
        gradient: discussion.category.colorHex
          ? `linear-gradient(135deg, ${discussion.category.colorHex}CC 0%, ${discussion.category.colorHex} 100%)`
          : FEATURED_GRADIENTS[index % FEATURED_GRADIENTS.length],
        categoryName: discussion.category.name,
        categorySlug: discussion.category.slug,
        authorName: discussion.author.displayName ?? 'Anonymous',
        authorInitials: (discussion.author.displayName ?? 'AN')
          .split(' ')
          .map((word: string) => word[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        authorAvatarUrl: discussion.author.avatarUrl,
        isVerified: discussion.author.lawyerProfile?.verificationStatus === 'VERIFIED',
        regionName: discussion.region?.name ?? null,
      }));

    const focusCategories = focusCategoriesRaw
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        colorHex: category.colorHex,
        iconName: category.iconName,
        discussionCount: category._count.discussions,
        answeredCount: category.discussions.filter((discussion) => discussion.answerCount > 0).length,
        aiSummaryCount: category.discussions.filter((discussion) => discussion.isAiSummaryReady).length,
      }))
      .sort((left, right) => right.discussionCount - left.discussionCount)
      .slice(0, 6);

    return NextResponse.json({
      communityBrief,
      topLawyers,
      trendingTopics,
      regionalHotTopics,
      featuredDiscussions,
      focusCategories,
    });
  } catch (error) {
    console.error('[GET /api/discussions/sidebar]', error);
    return NextResponse.json({ error: 'Failed to load sidebar data' }, { status: 500 });
  }
}
