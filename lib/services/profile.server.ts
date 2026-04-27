import { prisma } from "@/lib/prisma";
import {
  getNormalizedActivityDate,
  upsertUserActivityDaily,
} from "@/lib/services/user-activity";
import type {
  ConsultationAvailability,
  ProfileEditorSection,
  ProfileContributionLink,
  ProfileEditMeta,
  ProfileFormInput,
  ProfileHeatmapDay,
  ProfileVisibility,
  ProfileVisibilitySettings,
  ProfessionalProfile,
} from "@/types/profile";
import { Prisma, ProfileCompletionState } from "@prisma/client";

type ViewerContext = {
  userId?: string | null;
  authenticated: boolean;
  roles: string[];
  isLawyer: boolean;
};

const DEFAULT_VISIBILITY: ProfileVisibilitySettings = {
  emailVisibility: "MEMBERS_ONLY",
  phoneVisibility: "PRIVATE",
  headlineVisibility: "PUBLIC",
  bioVisibility: "PUBLIC",
  locationVisibility: "PUBLIC",
  companyVisibility: "PUBLIC",
  experienceVisibility: "PUBLIC",
  educationVisibility: "PUBLIC",
  certificationsVisibility: "PUBLIC",
  skillsVisibility: "PUBLIC",
  languagesVisibility: "PUBLIC",
  websiteVisibility: "PUBLIC",
  socialLinksVisibility: "PUBLIC",
  activityAnalyticsVisibility: "PUBLIC",
  badgesVisibility: "PUBLIC",
};

const oneYearAgo = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 364);
  return getNormalizedActivityDate(date);
};

const profileQuery = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    displayName: true,
    avatarUrl: true,
    createdAt: true,
    identifiers: {
      where: { isPrimary: true },
      select: { type: true, value: true },
    },
    profile: {
      select: {
        username: true,
        headline: true,
        bio: true,
        company: true,
        roleTitle: true,
        websiteUrl: true,
        linkedInUrl: true,
        coverImageUrl: true,
        countryCode: true,
        city: true,
        officeAddress: true,
        isLawyer: true,
        yearsExperience: true,
        consultationStatus: true,
        completionPercentage: true,
        completionState: true,
        onboardingStep: true,
        onboardingChecklist: true,
        onboardingCompletedAt: true,
        primaryRegionId: true,
        primaryRegion: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    },
    lawyerProfile: {
      select: {
        barCouncil: true,
        barLicenseNumber: true,
        practiceStartYear: true,
        firmName: true,
        chamberAddress: true,
        verificationStatus: true,
        verifiedAt: true,
        practiceAreas: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
          select: {
            yearsExperience: true,
            isPrimary: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    },
    profileVisibility: {
      select: {
        emailVisibility: true,
        phoneVisibility: true,
        headlineVisibility: true,
        bioVisibility: true,
        locationVisibility: true,
        companyVisibility: true,
        experienceVisibility: true,
        educationVisibility: true,
        certificationsVisibility: true,
        skillsVisibility: true,
        languagesVisibility: true,
        websiteVisibility: true,
        socialLinksVisibility: true,
        activityAnalyticsVisibility: true,
        badgesVisibility: true,
      },
    },
    stats: {
      select: {
        discussionCount: true,
        answerCount: true,
        commentCount: true,
        caseCount: true,
        acceptedAnswerCount: true,
        followerCount: true,
        bookmarkCount: true,
        reactionReceivedCount: true,
        profileViewCount: true,
        contributionScore: true,
        lastContributionAt: true,
      },
    },
    gamification: {
      select: {
        totalPoints: true,
        level: true,
        badgesCount: true,
        lastContributionAt: true,
      },
    },
    badges: {
      orderBy: { awardedAt: "desc" },
      select: {
        id: true,
        awardedAt: true,
        badge: {
          select: {
            code: true,
            name: true,
            description: true,
            iconName: true,
          },
        },
      },
    },
    experiences: {
      orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
      select: {
        id: true,
        title: true,
        organization: true,
        location: true,
        employmentType: true,
        description: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
      },
    },
    educations: {
      orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
      select: {
        id: true,
        institution: true,
        degree: true,
        fieldOfStudy: true,
        description: true,
        startDate: true,
        endDate: true,
      },
    },
    certifications: {
      orderBy: [{ sortOrder: "asc" }, { issuedAt: "desc" }],
      select: {
        id: true,
        name: true,
        issuer: true,
        credentialId: true,
        credentialUrl: true,
        issuedAt: true,
        expiresAt: true,
        description: true,
      },
    },
    skills: {
      orderBy: [{ sortOrder: "asc" }, { endorsementCount: "desc" }],
      select: {
        id: true,
        name: true,
        yearsExperience: true,
      },
    },
    languages: {
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        proficiency: true,
      },
    },
    awards: {
      orderBy: [{ sortOrder: "asc" }, { awardedAt: "desc" }],
      select: {
        id: true,
        title: true,
        issuer: true,
        description: true,
        awardUrl: true,
        awardedAt: true,
      },
    },
    socialLinks: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        platform: true,
        label: true,
        url: true,
      },
    },
    discussions: {
      where: {
        contentStatus: "ACTIVE",
        visibility: "PUBLIC",
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        slug: true,
        title: true,
        answerCount: true,
        createdAt: true,
      },
    },
    answers: {
      where: {
        status: "ACTIVE",
        discussion: {
          contentStatus: "ACTIVE",
          visibility: "PUBLIC",
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        body: true,
        isAccepted: true,
        createdAt: true,
        discussion: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    },
    caseRecords: {
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        slug: true,
        title: true,
        canonicalCitation: true,
        createdAt: true,
      },
    },
    activityDaily: {
      where: {
        activityDate: {
          gte: oneYearAgo(),
        },
      },
      orderBy: { activityDate: "asc" },
      select: {
        activityDate: true,
        discussionCount: true,
        answerCount: true,
        commentCount: true,
        caseCount: true,
        reactionReceivedCount: true,
        profileViewCount: true,
        badgeCount: true,
        engagementScore: true,
      },
    },
  },
});

const profileSelect = profileQuery.select;

type ProfileRecord = Prisma.UserGetPayload<typeof profileQuery> | null;

function normalizeOptionalUrl(
  value: string | undefined,
  fieldLabel: string,
  options?: { allowDataImage?: boolean; requireLinkedInHost?: boolean },
) {
  if (value === undefined) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (options?.allowDataImage && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(trimmed)) {
    return trimmed;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`${fieldLabel} must be a valid URL`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${fieldLabel} must start with http:// or https://`);
  }

  if (
    options?.requireLinkedInHost &&
    !parsed.hostname.toLowerCase().includes("linkedin.com")
  ) {
    throw new Error("LinkedIn URL must point to linkedin.com");
  }

  return parsed.toString();
}

function toIsoDate(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

function viewerCanAccess(
  level: ProfileVisibility,
  viewer: ViewerContext,
  ownerId: string,
) {
  if (viewer.userId === ownerId) return true;
  if (level === "PUBLIC") return true;
  if (level === "PRIVATE") return false;
  if (level === "MEMBERS_ONLY") return viewer.authenticated;
  if (level === "LAWYERS_ONLY") return viewer.isLawyer;
  return false;
}

function buildVisibilitySettings(
  value?: Partial<ProfileVisibilitySettings> | null,
): ProfileVisibilitySettings {
  return { ...DEFAULT_VISIBILITY, ...(value ?? {}) };
}

function buildViewerContext(input?: {
  id?: string | null;
  roles?: string[] | null;
}): ViewerContext {
  const roles = input?.roles ?? [];
  return {
    userId: input?.id ?? null,
    authenticated: Boolean(input?.id),
    roles,
    isLawyer: roles.some((role) => role.toUpperCase() === "LAWYER"),
  };
}

function generateUsernameBase(displayName: string) {
  const normalized = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return normalized || `member-${Date.now().toString(36)}`;
}

export async function generateUniqueUsername(displayName: string, userId?: string) {
  const base = generateUsernameBase(displayName);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.userProfile.findUnique({
      where: { username: candidate },
      select: { userId: true },
    });

    if (!existing || existing.userId === userId) return candidate;
    candidate = `${base}-${suffix++}`.slice(0, 30);
  }
}

function calculateProfileCompletion(record: ProfileRecord) {
  const profile = record?.profile;
  const lawyerProfile = record?.lawyerProfile;
  const completionChecks = [
    Boolean(record?.displayName?.trim()),
    Boolean(profile?.username?.trim()),
    Boolean(record?.avatarUrl?.trim()),
    Boolean(profile?.headline?.trim()),
    Boolean(profile?.bio?.trim()),
    Boolean((profile?.company ?? lawyerProfile?.firmName)?.trim()),
    Boolean(profile?.city?.trim() || profile?.primaryRegion?.name),
    Boolean(profile?.linkedInUrl?.trim() || profile?.websiteUrl?.trim()),
    Boolean(record?.experiences?.length),
    Boolean(record?.educations?.length),
    Boolean(record?.skills?.length || lawyerProfile?.practiceAreas?.length),
    Boolean(record?.languages?.length),
  ];

  const missingChecklist = [
    !completionChecks[0] && "Add your full name",
    !completionChecks[1] && "Claim a public username",
    !completionChecks[2] && "Upload a professional headshot",
    !completionChecks[3] && "Add a clear professional headline",
    !completionChecks[4] && "Write your professional summary",
    !completionChecks[5] && "Add your firm or company",
    !completionChecks[6] && "Add your region and city",
    !completionChecks[7] && "Add LinkedIn or a website",
    !completionChecks[8] && "Add professional experience",
    !completionChecks[9] && "Add education",
    !completionChecks[10] && "Add practice areas or skills",
    !completionChecks[11] && "Add languages",
  ].filter(Boolean) as string[];

  const percentage = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
  );

  return {
    percentage,
    state:
      percentage >= 90
        ? ProfileCompletionState.COMPLETED
        : percentage > 0
          ? ProfileCompletionState.IN_PROGRESS
          : ProfileCompletionState.NOT_STARTED,
    missingChecklist,
  };
}

async function getFallbackActivityDays(userId: string) {
  const since = oneYearAgo();
  const [discussions, answers, comments, cases, views, badges] = await Promise.all([
    prisma.discussion.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.answer.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.comment.findMany({
      where: { authorId: userId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.caseRecord.findMany({
      where: { authorId: userId, createdAt: { gte: since }, deletedAt: null },
      select: { createdAt: true },
    }),
    prisma.userProfileView.findMany({
      where: { profileUserId: userId, viewedAt: { gte: since } },
      select: { viewedAt: true },
    }),
    prisma.userBadge.findMany({
      where: { userId, awardedAt: { gte: since } },
      select: { awardedAt: true },
    }),
  ]);

  const map = new Map<
    string,
    {
      discussionCount: number;
      answerCount: number;
      commentCount: number;
      caseCount: number;
      reactionReceivedCount: number;
      profileViewCount: number;
      badgeCount: number;
      engagementScore: number;
    }
  >();

  const touch = (
    date: Date,
    field:
      | "discussionCount"
      | "answerCount"
      | "commentCount"
      | "caseCount"
      | "profileViewCount"
      | "badgeCount",
    score: number,
  ) => {
    const key = getNormalizedActivityDate(date).toISOString();
    const current =
      map.get(key) ??
      {
        discussionCount: 0,
        answerCount: 0,
        commentCount: 0,
        caseCount: 0,
        reactionReceivedCount: 0,
        profileViewCount: 0,
        badgeCount: 0,
        engagementScore: 0,
      };
    current[field] += 1;
    current.engagementScore += score;
    map.set(key, current);
  };

  discussions.forEach((item) => touch(item.createdAt, "discussionCount", 5));
  answers.forEach((item) => touch(item.createdAt, "answerCount", 10));
  comments.forEach((item) => touch(item.createdAt, "commentCount", 2));
  cases.forEach((item) => touch(item.createdAt, "caseCount", 12));
  views.forEach((item) => touch(item.viewedAt, "profileViewCount", 1));
  badges.forEach((item) => touch(item.awardedAt, "badgeCount", 8));

  return Array.from(map.entries()).map(([activityDate, value]) => ({
    activityDate: new Date(activityDate),
    ...value,
  }));
}

async function buildHeatmap(record: ProfileRecord) {
  const rows =
    record?.activityDaily && record.activityDaily.length > 0
      ? record.activityDaily
      : await getFallbackActivityDays(record!.id);

  const byDate = new Map(
    rows.map((row) => [
      getNormalizedActivityDate(row.activityDate).toISOString(),
      {
        discussionCount: row.discussionCount,
        answerCount: row.answerCount,
        commentCount: row.commentCount,
        caseCount: row.caseCount,
        reactionReceivedCount: row.reactionReceivedCount,
        profileViewCount: row.profileViewCount,
        badgeCount: row.badgeCount,
        engagementScore: row.engagementScore,
      },
    ]),
  );

  const start = oneYearAgo();
  const days: Array<Omit<ProfileHeatmapDay, "intensity">> = [];
  const totals: number[] = [];

  for (let index = 0; index < 365; index += 1) {
    const currentDate = new Date(start);
    currentDate.setUTCDate(start.getUTCDate() + index);
    const key = getNormalizedActivityDate(currentDate).toISOString();
    const current = byDate.get(key) ?? {
      discussionCount: 0,
      answerCount: 0,
      commentCount: 0,
      caseCount: 0,
      reactionReceivedCount: 0,
      profileViewCount: 0,
      badgeCount: 0,
      engagementScore: 0,
    };
    const total =
      current.discussionCount +
      current.answerCount +
      current.commentCount +
      current.caseCount +
      current.reactionReceivedCount +
      current.profileViewCount +
      current.badgeCount;

    totals.push(total);
    days.push({
      date: currentDate.toISOString(),
      total,
      discussionCount: current.discussionCount,
      answerCount: current.answerCount,
      commentCount: current.commentCount,
      caseCount: current.caseCount,
      reactionReceivedCount: current.reactionReceivedCount,
      profileViewCount: current.profileViewCount,
      badgeCount: current.badgeCount,
      engagementScore: current.engagementScore,
    });
  }

  const maxTotal = Math.max(...totals, 0);

  return days.map((day) => {
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (day.total > 0 && maxTotal > 0) {
      const ratio = day.total / maxTotal;
      intensity = ratio >= 0.85 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.35 ? 2 : 1;
    }

    return {
      ...day,
      intensity,
    };
  });
}

function buildRecentContributions(record: ProfileRecord) {
  const items: ProfileContributionLink[] = [];

  for (const discussion of record?.discussions ?? []) {
    items.push({
      id: discussion.id,
      title: discussion.title,
      href: `/discussions/${discussion.slug}`,
      kind: "discussion",
      createdAt: discussion.createdAt.toISOString(),
      metricLabel: `${discussion.answerCount} answers`,
    });
  }

  for (const answer of record?.answers ?? []) {
    items.push({
      id: answer.id,
      title: answer.discussion.title,
      href: `/discussions/${answer.discussion.slug}`,
      kind: "answer",
      createdAt: answer.createdAt.toISOString(),
      detail: answer.isAccepted ? "Accepted answer" : "Recent answer",
      metricLabel: answer.isAccepted ? "Accepted" : null,
    });
  }

  for (const caseRecord of record?.caseRecords ?? []) {
    items.push({
      id: caseRecord.id,
      title: caseRecord.title,
      href: `/cases/${caseRecord.slug}`,
      kind: "case",
      createdAt: caseRecord.createdAt.toISOString(),
      detail: caseRecord.canonicalCitation,
    });
  }

  return items
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 8);
}

function buildAnalytics(record: ProfileRecord, heatmap: ProfileHeatmapDay[]) {
  const stats = record?.stats;
  const gamification = record?.gamification;
  const last90 = heatmap.slice(-90);
  const last30 = heatmap.slice(-30);
  const previous30 = heatmap.slice(-60, -30);
  const activeDays = last90.filter((day) => day.total > 0).length;
  const totalPosts = last90.reduce(
    (sum, day) =>
      sum + day.discussionCount + day.answerCount + day.commentCount + day.caseCount,
    0,
  );
  const postingRate =
    activeDays === 0 ? "No recent posting activity" : `${totalPosts} contributions over ${activeDays} active days`;
  const currentTrendScore = last30.reduce((sum, day) => sum + day.engagementScore, 0);
  const previousTrendScore = previous30.reduce(
    (sum, day) => sum + day.engagementScore,
    0,
  );

  let trendDirection: "up" | "down" | "flat" = "flat";
  let trendLabel = "Stable activity trend";

  if (currentTrendScore > previousTrendScore) {
    trendDirection = "up";
    trendLabel = "Activity is trending upward";
  } else if (currentTrendScore < previousTrendScore) {
    trendDirection = "down";
    trendLabel = "Activity softened versus the previous month";
  }

  return {
    discussions: stats?.discussionCount ?? 0,
    answers: stats?.answerCount ?? 0,
    comments: stats?.commentCount ?? 0,
    cases: stats?.caseCount ?? 0,
    acceptedAnswers: stats?.acceptedAnswerCount ?? 0,
    followers: stats?.followerCount ?? 0,
    reactionsReceived: stats?.reactionReceivedCount ?? 0,
    profileViews: stats?.profileViewCount ?? 0,
    badges: gamification?.badgesCount ?? record?.badges.length ?? 0,
    points: gamification?.totalPoints ?? 0,
    level: gamification?.level ?? 1,
    postingRateLabel: postingRate,
    trendLabel,
    trendDirection,
    lastContributionAt:
      stats?.lastContributionAt?.toISOString() ??
      gamification?.lastContributionAt?.toISOString() ??
      null,
  };
}

function formatProfile(record: ProfileRecord): ProfessionalProfile {
  const visibility = buildVisibilitySettings(record?.profileVisibility);
  const completion = calculateProfileCompletion(record);
  const experiences =
    record?.experiences.map((item) => ({
      id: item.id,
      title: item.title,
      organization: item.organization,
      location: item.location ?? undefined,
      employmentType: item.employmentType ?? undefined,
      description: item.description ?? undefined,
      startDate: toIsoDate(item.startDate),
      endDate: toIsoDate(item.endDate),
      isCurrent: item.isCurrent,
    })) ?? [];
  const educations =
    record?.educations.map((item) => ({
      id: item.id,
      institution: item.institution,
      degree: item.degree ?? undefined,
      fieldOfStudy: item.fieldOfStudy ?? undefined,
      description: item.description ?? undefined,
      startDate: toIsoDate(item.startDate),
      endDate: toIsoDate(item.endDate),
    })) ?? [];
  const certifications =
    record?.certifications.map((item) => ({
      id: item.id,
      name: item.name,
      issuer: item.issuer ?? undefined,
      credentialId: item.credentialId ?? undefined,
      credentialUrl: item.credentialUrl ?? undefined,
      issuedAt: toIsoDate(item.issuedAt),
      expiresAt: toIsoDate(item.expiresAt),
      description: item.description ?? undefined,
    })) ?? [];
  const skills =
    record?.skills.map((item) => ({
      id: item.id,
      name: item.name,
      yearsExperience: item.yearsExperience,
    })) ?? [];
  const languages =
    record?.languages.map((item) => ({
      id: item.id,
      name: item.name,
      proficiency: item.proficiency ?? undefined,
    })) ?? [];
  const awards =
    record?.awards.map((item) => ({
      id: item.id,
      title: item.title,
      issuer: item.issuer ?? undefined,
      description: item.description ?? undefined,
      awardUrl: item.awardUrl ?? undefined,
      awardedAt: toIsoDate(item.awardedAt),
    })) ?? [];
  const socialLinks =
    record?.socialLinks.map((item) => ({
      id: item.id,
      platform: item.platform,
      label: item.label ?? undefined,
      url: item.url,
    })) ?? [];

  return {
    userId: record!.id,
    displayName: record?.displayName ?? "Legal Hub User",
    email:
      record?.identifiers.find((item) => item.type === "EMAIL")?.value ?? null,
    phone:
      record?.identifiers.find((item) => item.type === "PHONE")?.value ?? null,
    username: record?.profile?.username ?? null,
    avatarUrl: record?.avatarUrl ?? null,
    coverImageUrl: record?.profile?.coverImageUrl ?? null,
    headline: record?.profile?.headline ?? null,
    bio: record?.profile?.bio ?? null,
    company: record?.profile?.company ?? record?.lawyerProfile?.firmName ?? null,
    roleTitle: record?.profile?.roleTitle ?? null,
    city: record?.profile?.city ?? null,
    countryCode: record?.profile?.countryCode ?? null,
    primaryRegionId: record?.profile?.primaryRegionId ?? null,
    regionName: record?.profile?.primaryRegion?.name ?? null,
    officeAddress:
      record?.profile?.officeAddress ?? record?.lawyerProfile?.chamberAddress ?? null,
    websiteUrl: record?.profile?.websiteUrl ?? null,
    linkedInUrl: record?.profile?.linkedInUrl ?? null,
    yearsExperience:
      record?.profile?.yearsExperience ??
      (record?.lawyerProfile?.practiceStartYear
        ? new Date().getFullYear() - record.lawyerProfile.practiceStartYear
        : null),
    consultationStatus:
      (record?.profile?.consultationStatus as ConsultationAvailability | null) ?? null,
    isLawyer: record?.profile?.isLawyer ?? Boolean(record?.lawyerProfile),
    verificationStatus: record?.lawyerProfile?.verificationStatus ?? null,
    verifiedAt: record?.lawyerProfile?.verifiedAt?.toISOString() ?? null,
    firmName: record?.lawyerProfile?.firmName ?? null,
    barCouncil: record?.lawyerProfile?.barCouncil ?? null,
    practiceAreas:
      record?.lawyerProfile?.practiceAreas.map((item) => ({
        id: item.category.id,
        name: item.category.name,
        yearsExperience: item.yearsExperience,
        isPrimary: item.isPrimary,
      })) ?? [],
    experiences,
    educations,
    certifications,
    skills,
    languages,
    awards,
    socialLinks,
    badges:
      record?.badges.map((item) => ({
        id: item.id,
        code: item.badge.code,
        name: item.badge.name,
        description: item.badge.description,
        iconName: item.badge.iconName,
        awardedAt: item.awardedAt.toISOString(),
      })) ?? [],
    analytics: {
      discussions: 0,
      answers: 0,
      comments: 0,
      cases: 0,
      acceptedAnswers: 0,
      followers: 0,
      reactionsReceived: 0,
      profileViews: 0,
      badges: 0,
      points: 0,
      level: 1,
      postingRateLabel: "No recent posting activity",
      trendLabel: "Stable activity trend",
      trendDirection: "flat",
      lastContributionAt: null,
    },
    heatmap: [],
    recentContributions: [],
    completionPercentage: completion.percentage,
    completionState: completion.state,
    missingChecklist: completion.missingChecklist,
    visibility,
    createdAt: record?.createdAt.toISOString(),
  };
}

function applyVisibilityRules(
  profile: ProfessionalProfile,
  viewer: ViewerContext,
) {
  const canSee = (level: ProfileVisibility) =>
    viewerCanAccess(level, viewer, profile.userId);
  const hiddenAnalytics = {
    ...profile.analytics,
    discussions: 0,
    answers: 0,
    comments: 0,
    cases: 0,
    acceptedAnswers: 0,
    followers: 0,
    reactionsReceived: 0,
    profileViews: 0,
    badges: 0,
    points: 0,
    level: 1,
    postingRateLabel: "Private analytics",
    trendLabel: "Private analytics",
    trendDirection: "flat" as const,
    lastContributionAt: null,
  };

  return {
    ...profile,
    email: canSee(profile.visibility.emailVisibility) ? profile.email : null,
    phone: canSee(profile.visibility.phoneVisibility) ? profile.phone : null,
    headline: canSee(profile.visibility.headlineVisibility) ? profile.headline : null,
    bio: canSee(profile.visibility.bioVisibility) ? profile.bio : null,
    city: canSee(profile.visibility.locationVisibility) ? profile.city : null,
    regionName: canSee(profile.visibility.locationVisibility)
      ? profile.regionName
      : null,
    officeAddress: canSee(profile.visibility.locationVisibility)
      ? profile.officeAddress
      : null,
    company: canSee(profile.visibility.companyVisibility) ? profile.company : null,
    roleTitle: canSee(profile.visibility.companyVisibility) ? profile.roleTitle : null,
    firmName: canSee(profile.visibility.companyVisibility) ? profile.firmName : null,
    websiteUrl: canSee(profile.visibility.websiteVisibility)
      ? profile.websiteUrl
      : null,
    linkedInUrl: canSee(profile.visibility.socialLinksVisibility)
      ? profile.linkedInUrl
      : null,
    experiences: canSee(profile.visibility.experienceVisibility)
      ? profile.experiences
      : [],
    educations: canSee(profile.visibility.educationVisibility)
      ? profile.educations
      : [],
    certifications: canSee(profile.visibility.certificationsVisibility)
      ? profile.certifications
      : [],
    skills: canSee(profile.visibility.skillsVisibility) ? profile.skills : [],
    practiceAreas: canSee(profile.visibility.skillsVisibility)
      ? profile.practiceAreas
      : [],
    languages: canSee(profile.visibility.languagesVisibility)
      ? profile.languages
      : [],
    socialLinks: canSee(profile.visibility.socialLinksVisibility)
      ? profile.socialLinks
      : [],
    badges: canSee(profile.visibility.badgesVisibility) ? profile.badges : [],
    analytics: canSee(profile.visibility.activityAnalyticsVisibility)
      ? profile.analytics
      : hiddenAnalytics,
    heatmap: canSee(profile.visibility.activityAnalyticsVisibility)
      ? profile.heatmap
      : [],
    recentContributions: canSee(profile.visibility.activityAnalyticsVisibility)
      ? profile.recentContributions
      : [],
  };
}

async function getProfileRecordByUserId(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
}

async function getProfileRecordByUsername(username: string) {
  return prisma.user.findFirst({
    where: {
      profile: {
        is: {
          username,
        },
      },
    },
    select: profileSelect,
  });
}

async function buildProfessionalProfile(record: ProfileRecord) {
  if (!record) return null;
  const profile = formatProfile(record);
  const heatmap = await buildHeatmap(record);
  const analytics = buildAnalytics(record, heatmap);

  return {
    ...profile,
    heatmap,
    analytics,
    recentContributions: buildRecentContributions(record),
  } satisfies ProfessionalProfile;
}

export async function getMyProfile(userId: string) {
  const record = await getProfileRecordByUserId(userId);
  return buildProfessionalProfile(record);
}

export async function getPublicProfile(
  username: string,
  viewerInput?: { id?: string | null; roles?: string[] | null },
) {
  const record = await getProfileRecordByUsername(username);
  const profile = await buildProfessionalProfile(record);
  if (!profile) return null;
  return applyVisibilityRules(profile, buildViewerContext(viewerInput));
}

export async function getPublicProfileByUserId(
  userId: string,
  viewerInput?: { id?: string | null; roles?: string[] | null },
) {
  const record = await getProfileRecordByUserId(userId);
  const profile = await buildProfessionalProfile(record);
  if (!profile) return null;
  return applyVisibilityRules(profile, buildViewerContext(viewerInput));
}

export async function getProfileEditMeta(): Promise<ProfileEditMeta> {
  const [regions, practiceAreas] = await Promise.all([
    prisma.region.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
      take: 100,
    }),
    prisma.category.findMany({
      where: {
        isActive: true,
        scope: { in: ["LAWYER_PRACTICE", "BOTH"] },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
      take: 100,
    }),
  ]);

  return { regions, practiceAreas };
}

function normalizeDateInput(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sanitizeLineItems<T extends { id?: string }>(
  items: T[],
  predicate: (item: T) => boolean,
) {
  return items.filter(predicate);
}

export async function saveProfessionalProfile(
  userId: string,
  input: ProfileFormInput,
  options?: { section?: ProfileEditorSection },
) {
  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    throw new Error("Display name must be at least 2 characters");
  }

  const requestedUsername = input.username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  if (!requestedUsername) {
    throw new Error("Username is required");
  }

  const [existingProfile, existingUsername, userWithLawyer] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      select: { username: true },
    }),
    prisma.userProfile.findUnique({
      where: { username: requestedUsername },
      select: { userId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { lawyerProfile: { select: { id: true } } },
    }),
  ]);

  if (existingUsername && existingUsername.userId !== userId) {
    throw new Error("That username is already taken");
  }

  const avatarUrl = normalizeOptionalUrl(input.avatarUrl, "Profile photo", {
    allowDataImage: true,
  });
  const coverImageUrl = normalizeOptionalUrl(input.coverImageUrl, "Cover image", {
    allowDataImage: true,
  });
  const websiteUrl = normalizeOptionalUrl(input.websiteUrl, "Website URL");
  const linkedInUrl = normalizeOptionalUrl(input.linkedInUrl, "LinkedIn URL", {
    requireLinkedInHost: true,
  });
  const credentialUrls = input.certifications.map((item) =>
    normalizeOptionalUrl(item.credentialUrl, "Credential URL"),
  );
  const awardUrls = input.awards.map((item) =>
    normalizeOptionalUrl(item.awardUrl, "Award URL"),
  );
  const safeVisibility = buildVisibilitySettings(input.visibility);
  const safeSkills = sanitizeLineItems(
    input.skills.map((item) => ({
      ...item,
      name: item.name.trim(),
    })),
    (item) => item.name.length > 0,
  );
  const safeLanguages = sanitizeLineItems(
    input.languages.map((item) => ({
      ...item,
      name: item.name.trim(),
    })),
    (item) => item.name.length > 0,
  );
  const safeExperiences = sanitizeLineItems(
    input.experiences.map((item) => ({
      ...item,
      title: item.title.trim(),
      organization: item.organization.trim(),
    })),
    (item) => item.title.length > 0 && item.organization.length > 0,
  );
  const safeEducations = sanitizeLineItems(
    input.educations.map((item) => ({
      ...item,
      institution: item.institution.trim(),
    })),
    (item) => item.institution.length > 0,
  );
  const safeCertifications = sanitizeLineItems(
    input.certifications.map((item, index) => ({
      ...item,
      name: item.name.trim(),
      credentialUrl: credentialUrls[index] ?? null,
    })),
    (item) => item.name.length > 0,
  );
  const safeAwards = sanitizeLineItems(
    input.awards.map((item, index) => ({
      ...item,
      title: item.title.trim(),
      awardUrl: awardUrls[index] ?? null,
    })),
    (item) => item.title.length > 0,
  );
  const safeSocialLinks = sanitizeLineItems(
    input.socialLinks.map((item) => ({
      ...item,
      platform: item.platform.trim() || "Link",
      url: normalizeOptionalUrl(item.url, `${item.platform || "Social"} URL`) ?? "",
    })),
    (item) => item.url.length > 0,
  );

  const headline = input.headline?.trim() || null;
  const bio = input.bio?.trim() || null;
  const company = input.company?.trim() || null;
  const roleTitle = input.roleTitle?.trim() || null;
  const city = input.city?.trim() || null;
  const countryCode = input.countryCode?.trim() || "PK";
  const primaryRegionId = input.primaryRegionId?.trim() || null;
  const officeAddress = input.officeAddress?.trim() || null;
  const consultationStatus = input.consultationStatus ?? null;
  const isLawyer = Boolean(userWithLawyer?.lawyerProfile);

  const previewRecord = {
    displayName,
    avatarUrl: avatarUrl ?? null,
    profile: {
      username: requestedUsername,
      headline,
      bio,
      company,
      roleTitle,
      websiteUrl: websiteUrl ?? null,
      linkedInUrl: linkedInUrl ?? null,
      city,
      yearsExperience: input.yearsExperience ?? null,
    },
    lawyerProfile: {
      firmName: company,
    },
    experiences: safeExperiences,
    educations: safeEducations,
    skills: safeSkills,
    languages: safeLanguages,
  } as unknown as ProfileRecord;

  const completion = calculateProfileCompletion(previewRecord);
  const profileLifecycleData = {
    isLawyer,
    completionPercentage: completion.percentage,
    completionState: completion.state,
    onboardingStep:
      completion.state === ProfileCompletionState.COMPLETED
        ? "completed"
        : "profile_setup",
    onboardingChecklist: completion.missingChecklist,
    onboardingCompletedAt:
      completion.state === ProfileCompletionState.COMPLETED ? new Date() : null,
  };

  const fullProfileCreateData = {
    userId,
    username: requestedUsername,
    headline,
    bio,
    company,
    roleTitle,
    websiteUrl,
    linkedInUrl,
    coverImageUrl: coverImageUrl ?? null,
    countryCode,
    city,
    officeAddress,
    primaryRegionId,
    yearsExperience: input.yearsExperience ?? null,
    consultationStatus,
    ...profileLifecycleData,
  };

  const saveIdentitySection = async () => {
    const queries: Prisma.PrismaPromise<unknown>[] = [
      prisma.user.update({
        where: { id: userId },
        data: {
          displayName,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        },
      }),
      prisma.userProfile.upsert({
        where: { userId },
        update: {
          username: requestedUsername,
          headline,
          company,
          roleTitle,
          ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
          countryCode,
          city,
          primaryRegionId,
          yearsExperience: input.yearsExperience ?? null,
          consultationStatus,
          ...profileLifecycleData,
        },
        create: fullProfileCreateData,
      }),
    ];

    if (isLawyer) {
      queries.push(
        prisma.lawyerProfile.update({
          where: { userId },
          data: { firmName: company },
        }),
      );
    }

    await prisma.$transaction(queries);
  };

  const saveSummarySection = async () => {
    const queries: Prisma.PrismaPromise<unknown>[] = [
      prisma.userProfile.upsert({
        where: { userId },
        update: {
          bio,
          websiteUrl,
          linkedInUrl,
          officeAddress,
          ...profileLifecycleData,
        },
        create: fullProfileCreateData,
      }),
    ];

    if (isLawyer) {
      queries.push(
        prisma.lawyerProfile.update({
          where: { userId },
          data: { chamberAddress: officeAddress },
        }),
      );
    }

    await prisma.$transaction(queries);
  };

  const saveExpertiseSection = async () => {
    const queries: Prisma.PrismaPromise<unknown>[] = [
      prisma.userProfile.upsert({
        where: { userId },
        update: profileLifecycleData,
        create: fullProfileCreateData,
      }),
      prisma.userSkill.deleteMany({ where: { userId } }),
      prisma.userLanguage.deleteMany({ where: { userId } }),
    ];

    if (safeSkills.length > 0) {
      queries.push(
        prisma.userSkill.createMany({
          data: safeSkills.map((item, index) => ({
            userId,
            name: item.name,
            yearsExperience: item.yearsExperience ?? null,
            sortOrder: index,
          })),
          skipDuplicates: true,
        }),
      );
    }

    if (safeLanguages.length > 0) {
      queries.push(
        prisma.userLanguage.createMany({
          data: safeLanguages.map((item, index) => ({
            userId,
            name: item.name,
            proficiency: item.proficiency?.trim() || null,
            sortOrder: index,
          })),
          skipDuplicates: true,
        }),
      );
    }

    if (userWithLawyer?.lawyerProfile?.id) {
      queries.push(
        prisma.lawyerPracticeArea.deleteMany({
          where: { lawyerProfileId: userWithLawyer.lawyerProfile.id },
        }),
      );

      if (input.practiceAreaCategoryIds.length > 0) {
        queries.push(
          prisma.lawyerPracticeArea.createMany({
            data: input.practiceAreaCategoryIds.map((categoryId, index) => ({
              lawyerProfileId: userWithLawyer.lawyerProfile!.id,
              categoryId,
              isPrimary: index === 0,
              yearsExperience: input.yearsExperience ?? null,
            })),
            skipDuplicates: true,
          }),
        );
      }
    }

    await prisma.$transaction(queries);
  };

  const saveBackgroundSection = async () => {
    const queries: Prisma.PrismaPromise<unknown>[] = [
      prisma.userProfile.upsert({
        where: { userId },
        update: profileLifecycleData,
        create: fullProfileCreateData,
      }),
      prisma.userExperience.deleteMany({ where: { userId } }),
      prisma.userEducation.deleteMany({ where: { userId } }),
    ];

    if (safeExperiences.length > 0) {
      queries.push(
        prisma.userExperience.createMany({
          data: safeExperiences.map((item, index) => ({
            userId,
            title: item.title,
            organization: item.organization,
            location: item.location?.trim() || null,
            employmentType: item.employmentType?.trim() || null,
            description: item.description?.trim() || null,
            startDate: normalizeDateInput(item.startDate),
            endDate: item.isCurrent ? null : normalizeDateInput(item.endDate),
            isCurrent: Boolean(item.isCurrent),
            sortOrder: index,
          })),
        }),
      );
    }

    if (safeEducations.length > 0) {
      queries.push(
        prisma.userEducation.createMany({
          data: safeEducations.map((item, index) => ({
            userId,
            institution: item.institution,
            degree: item.degree?.trim() || null,
            fieldOfStudy: item.fieldOfStudy?.trim() || null,
            description: item.description?.trim() || null,
            startDate: normalizeDateInput(item.startDate),
            endDate: normalizeDateInput(item.endDate),
            sortOrder: index,
          })),
        }),
      );
    }

    await prisma.$transaction(queries);
  };

  const saveTrustSection = async () => {
    const queries: Prisma.PrismaPromise<unknown>[] = [
      prisma.userProfile.upsert({
        where: { userId },
        update: profileLifecycleData,
        create: fullProfileCreateData,
      }),
      prisma.userProfileVisibility.upsert({
        where: { userId },
        update: safeVisibility,
        create: {
          userId,
          ...safeVisibility,
        },
      }),
      prisma.userCertification.deleteMany({ where: { userId } }),
      prisma.userAward.deleteMany({ where: { userId } }),
      prisma.userSocialLink.deleteMany({ where: { userId } }),
    ];

    if (safeCertifications.length > 0) {
      queries.push(
        prisma.userCertification.createMany({
          data: safeCertifications.map((item, index) => ({
            userId,
            name: item.name,
            issuer: item.issuer?.trim() || null,
            credentialId: item.credentialId?.trim() || null,
            credentialUrl: item.credentialUrl,
            issuedAt: normalizeDateInput(item.issuedAt),
            expiresAt: normalizeDateInput(item.expiresAt),
            description: item.description?.trim() || null,
            sortOrder: index,
          })),
        }),
      );
    }

    if (safeAwards.length > 0) {
      queries.push(
        prisma.userAward.createMany({
          data: safeAwards.map((item, index) => ({
            userId,
            title: item.title,
            issuer: item.issuer?.trim() || null,
            description: item.description?.trim() || null,
            awardUrl: item.awardUrl,
            awardedAt: normalizeDateInput(item.awardedAt),
            sortOrder: index,
          })),
        }),
      );
    }

    if (safeSocialLinks.length > 0) {
      queries.push(
        prisma.userSocialLink.createMany({
          data: safeSocialLinks.map((item, index) => ({
            userId,
            platform: item.platform,
            label: item.label?.trim() || null,
            url: item.url,
            sortOrder: index,
          })),
        }),
      );
    }

    await prisma.$transaction(queries);
  };

  const targetSection = options?.section ?? "review";

  if (targetSection === "identity") {
    await saveIdentitySection();
  } else if (targetSection === "summary") {
    await saveSummarySection();
  } else if (targetSection === "expertise") {
    await saveExpertiseSection();
  } else if (targetSection === "background") {
    await saveBackgroundSection();
  } else if (targetSection === "trust") {
    await saveTrustSection();
  } else {
    await saveIdentitySection();
    await saveSummarySection();
    await saveExpertiseSection();
    await saveBackgroundSection();
    await saveTrustSection();
  }

  return {
    username: requestedUsername,
    previousUsername: existingProfile?.username ?? null,
    completionPercentage: completion.percentage,
    completionState: completion.state,
  };
}

export async function recordProfileView(
  profileUserId: string,
  viewerInput?: { id?: string | null; roles?: string[] | null },
  context?: { ipHash?: string | null; userAgent?: string | null; referer?: string | null },
) {
  const viewer = buildViewerContext(viewerInput);
  if (viewer.userId && viewer.userId === profileUserId) return;

  await prisma.$transaction(async (tx) => {
    await tx.userProfileView.create({
      data: {
        profileUserId,
        viewerUserId: viewer.userId ?? null,
        ipHash: context?.ipHash ?? null,
        userAgent: context?.userAgent ?? null,
        referer: context?.referer ?? null,
      },
    });

    await tx.userStats.upsert({
      where: { userId: profileUserId },
      update: {
        profileViewCount: { increment: 1 },
      },
      create: {
        userId: profileUserId,
        profileViewCount: 1,
      },
    });

    await upsertUserActivityDaily(tx, profileUserId, {
      profileViewCount: 1,
      engagementScore: 1,
    });
  });
}
