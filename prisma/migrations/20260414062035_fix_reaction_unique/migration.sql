-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('SYSTEM', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED', 'DELETED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('CREDENTIALS', 'OAUTH', 'SAML', 'OIDC');

-- CreateEnum
CREATE TYPE "MfaFactorType" AS ENUM ('TOTP', 'SMS', 'EMAIL', 'WEBAUTHN');

-- CreateEnum
CREATE TYPE "MfaFactorStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'SECURITY', 'USER', 'CONTENT', 'CASE_REPOSITORY', 'MODERATION', 'VERIFICATION', 'ORGANIZATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('COUNTRY', 'FEDERAL', 'PROVINCE', 'STATE', 'CITY', 'DISTRICT');

-- CreateEnum
CREATE TYPE "LawyerVerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('BAR_LICENSE', 'BAR_COUNCIL_CARD', 'PRACTICING_CERTIFICATE', 'NATIONAL_ID', 'PROFILE_PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('LAW_FIRM', 'BAR_ASSOCIATION', 'LAW_SCHOOL', 'GOVERNMENT', 'NGO', 'COMMUNITY', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "OrganizationMemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "CategoryScope" AS ENUM ('DISCUSSION', 'CASE', 'BOTH', 'LAWYER_PRACTICE');

-- CreateEnum
CREATE TYPE "DiscussionType" AS ENUM ('QUESTION', 'DISCUSSION', 'ANNOUNCEMENT', 'LEGAL_UPDATE');

-- CreateEnum
CREATE TYPE "DiscussionStatus" AS ENUM ('OPEN', 'RESOLVED', 'CLOSED', 'LOCKED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PENDING_MODERATION', 'FLAGGED', 'HIDDEN', 'REMOVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'UPVOTE', 'DOWNVOTE', 'HELPFUL', 'INSIGHTFUL', 'LOVE', 'HAPPY', 'UNHAPPY');

-- CreateEnum
CREATE TYPE "TagType" AS ENUM ('PRACTICE_AREA', 'TOPIC', 'TREND', 'SPECIALTY', 'LEGAL_CONCEPT');

-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "ContentTargetType" AS ENUM ('USER', 'ORGANIZATION', 'DISCUSSION', 'ANSWER', 'COMMENT', 'CASE');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'LEGAL_RISK', 'COPYRIGHT', 'PRIVACY', 'FRAUD', 'OFF_TOPIC', 'UNAUTHORIZED_PRACTICE', 'SENSITIVE_PII', 'DEFAMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTIONED', 'DISMISSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AIAlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARNING', 'NOTE_ADDED', 'CONTENT_HIDDEN', 'CONTENT_REMOVED', 'CONTENT_RESTORED', 'USER_SUSPENDED', 'USER_BANNED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'CASE_PUBLISHED', 'CASE_REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_ANSWER', 'ANSWER_ACCEPTED', 'DISCUSSION_FOLLOWED', 'DISCUSSION_MENTIONED', 'COMMENT_REPLIED', 'CASE_PUBLISHED', 'CASE_UPDATED', 'CASE_COMMENTED', 'BADGE_AWARDED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'REPORT_UPDATE', 'AI_SUMMARY_READY', 'ORGANIZATION_INVITE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CaseSourceType" AS ENUM ('USER_SUBMITTED', 'OFFICIAL_COURT', 'IMPORTED_EDITORIAL', 'COMMUNITY_CURATED');

-- CreateEnum
CREATE TYPE "RepositoryItemStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "CourtLevel" AS ENUM ('LOCAL', 'DISTRICT', 'HIGH', 'APPELLATE', 'SUPREME', 'TRIBUNAL', 'OTHER');

-- CreateEnum
CREATE TYPE "GamificationEventType" AS ENUM ('DISCUSSION_CREATED', 'ANSWER_POSTED', 'COMMENT_POSTED', 'ANSWER_ACCEPTED', 'DISCUSSION_REACTION_RECEIVED', 'ANSWER_REACTION_RECEIVED', 'COMMENT_REACTION_RECEIVED', 'CASE_SUBMITTED', 'CASE_PUBLISHED', 'CASE_REACTION_RECEIVED', 'DISCUSSION_BOOSTED', 'LAWYER_VERIFIED', 'BADGE_AWARDED', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FileScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('BUMP', 'FEATURE', 'PIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userType" "UserType" NOT NULL DEFAULT 'EXTERNAL',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "locale" TEXT DEFAULT 'en',
    "timeZone" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "lastUserAgent" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIdentifier" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordAlgo" TEXT,
    "passwordParams" JSONB,
    "passwordSetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mustRotate" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerType" "AuthProviderType" NOT NULL DEFAULT 'OAUTH',
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerEmail" TEXT,
    "providerDisplayName" TEXT,
    "providerAvatarUrl" TEXT,
    "providerProfile" JSONB,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "idTokenEncrypted" TEXT,
    "tokenType" TEXT,
    "scope" TEXT,
    "expiresAt" INTEGER,
    "refreshTokenExpiresAt" INTEGER,
    "sessionState" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "sessionFamilyId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaFactor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MfaFactorType" NOT NULL,
    "status" "MfaFactorStatus" NOT NULL DEFAULT 'PENDING',
    "label" TEXT,
    "secretEncrypted" TEXT,
    "credentialId" TEXT,
    "publicKey" TEXT,
    "counter" INTEGER,
    "phoneNumber" TEXT,
    "emailAddress" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaRecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "identifierType" "IdentifierType",
    "identifierValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifierType" "IdentifierType",
    "identifierValue" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "category" "AuditCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "targetUserId" TEXT,
    "targetType" "ContentTargetType",
    "targetId" TEXT,
    "requestId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "headline" TEXT,
    "bio" TEXT,
    "company" TEXT,
    "websiteUrl" TEXT,
    "linkedInUrl" TEXT,
    "countryCode" TEXT DEFAULT 'PK',
    "primaryRegionId" TEXT,
    "isLawyer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStats" (
    "userId" TEXT NOT NULL,
    "discussionCount" INTEGER NOT NULL DEFAULT 0,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "caseCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedAnswerCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "reactionReceivedCount" INTEGER NOT NULL DEFAULT 0,
    "profileViewCount" INTEGER NOT NULL DEFAULT 0,
    "contributionScore" INTEGER NOT NULL DEFAULT 0,
    "lastContributionAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserGamification" (
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "badgesCount" INTEGER NOT NULL DEFAULT 0,
    "likesReceived" INTEGER NOT NULL DEFAULT 0,
    "likesGiven" INTEGER NOT NULL DEFAULT 0,
    "acceptedAnswers" INTEGER NOT NULL DEFAULT 0,
    "casesPublished" INTEGER NOT NULL DEFAULT 0,
    "boostsUsed" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "bestRank" INTEGER,
    "lastContributionAt" TIMESTAMP(3),
    "lastCalculatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGamification_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GamificationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "GamificationEventType" NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "discussionId" TEXT,
    "answerId" TEXT,
    "commentId" TEXT,
    "caseId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "awardedById" TEXT,
    "reason" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "type" "OrganizationType" NOT NULL DEFAULT 'LAW_FIRM',
    "visibility" "OrganizationVisibility" NOT NULL DEFAULT 'PUBLIC',
    "ownerId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "OrganizationMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "barCouncil" TEXT,
    "barLicenseNumber" TEXT,
    "practiceStartYear" INTEGER,
    "firmName" TEXT,
    "chamberAddress" TEXT,
    "verificationStatus" "LawyerVerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerPracticeArea" (
    "id" TEXT NOT NULL,
    "lawyerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawyerPracticeArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerVerificationRequest" (
    "id" TEXT NOT NULL,
    "lawyerProfileId" TEXT NOT NULL,
    "status" "LawyerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionReason" TEXT,
    "adminNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LawyerVerificationDocument" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "VerificationDocumentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LawyerVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "CategoryScope" NOT NULL DEFAULT 'BOTH',
    "parentId" TEXT,
    "colorHex" TEXT,
    "iconName" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TagType" NOT NULL DEFAULT 'TOPIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionTag" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseTag" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagMetricDaily" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "discussionCount" INTEGER NOT NULL DEFAULT 0,
    "caseCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagMetricDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RegionType" NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'PK',
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Court" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "CourtLevel" NOT NULL DEFAULT 'OTHER',
    "regionId" TEXT,
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "DiscussionType" NOT NULL DEFAULT 'DISCUSSION',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "excerpt" TEXT,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "categoryId" TEXT NOT NULL,
    "regionId" TEXT,
    "relatedCaseId" TEXT,
    "status" "DiscussionStatus" NOT NULL DEFAULT 'OPEN',
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "contentStatus" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "acceptedAnswerId" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "answerCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "boostCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedUntil" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "isAiSummaryReady" BOOLEAN NOT NULL DEFAULT false,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isExpertAnswer" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT,
    "answerId" TEXT,
    "caseId" TEXT,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'ACTIVE',
    "score" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionRevision" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editorId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerRevision" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editorId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentRevision" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editorId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionReaction" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "emoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerReaction" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionFollow" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedDiscussion" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionView" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionBoost" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boostType" "BoostType" NOT NULL DEFAULT 'BUMP',
    "pointsCost" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "bucket" TEXT,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "checksumSha256" TEXT,
    "scanStatus" "FileScanStatus" NOT NULL DEFAULT 'PENDING',
    "scanCompletedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAttachment" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "discussionId" TEXT,
    "answerId" TEXT,
    "commentId" TEXT,
    "caseId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionAISummary" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "SummaryStatus" NOT NULL DEFAULT 'PENDING',
    "summaryText" TEXT,
    "mainIssue" TEXT,
    "keyPoints" JSONB,
    "expertConsensus" TEXT,
    "modelName" TEXT,
    "promptVersion" TEXT,
    "tokensUsed" INTEGER,
    "errorMessage" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "generatedById" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionAISummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseRecord" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "facts" TEXT,
    "issues" TEXT,
    "holding" TEXT,
    "outcome" TEXT,
    "proceduralHistory" TEXT,
    "canonicalCitation" TEXT,
    "docketNumber" TEXT,
    "sourceType" "CaseSourceType" NOT NULL DEFAULT 'USER_SUBMITTED',
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "RepositoryItemStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "authorId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "organizationId" TEXT,
    "primaryCategoryId" TEXT NOT NULL,
    "regionId" TEXT,
    "courtId" TEXT,
    "decisionDate" TIMESTAMP(3),
    "filedDate" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseRevision" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "editorId" TEXT NOT NULL,
    "status" "RepositoryItemStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "snapshot" JSONB NOT NULL,
    "changeSummary" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseCitation" (
    "id" TEXT NOT NULL,
    "sourceCaseId" TEXT NOT NULL,
    "citedCaseId" TEXT NOT NULL,
    "citationText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseSourceLink" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "label" TEXT,
    "sourceName" TEXT,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseSourceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseSourceFile" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseSourceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseReaction" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCase" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFollow" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseView" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT,
    "discussionId" TEXT,
    "answerId" TEXT,
    "commentId" TEXT,
    "caseId" TEXT,
    "targetType" "ContentTargetType" NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAlert" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "targetType" "ContentTargetType" NOT NULL,
    "discussionId" TEXT,
    "answerId" TEXT,
    "commentId" TEXT,
    "caseId" TEXT,
    "severity" "AIAlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "riskScore" DECIMAL(5,2),
    "status" "AIAlertStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "discussionId" TEXT,
    "answerId" TEXT,
    "commentId" TEXT,
    "caseId" TEXT,
    "reportId" TEXT,
    "aiAlertId" TEXT,
    "actionType" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "discussionId" TEXT,
    "answerId" TEXT,
    "commentId" TEXT,
    "caseId" TEXT,
    "organizationId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_userType_status_idx" ON "User"("userType", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "UserIdentifier_userId_type_idx" ON "UserIdentifier"("userId", "type");

-- CreateIndex
CREATE INDEX "UserIdentifier_userId_isPrimary_idx" ON "UserIdentifier"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentifier_type_normalizedValue_key" ON "UserIdentifier"("type", "normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_userId_key" ON "Credential"("userId");

-- CreateIndex
CREATE INDEX "ExternalAccount_userId_provider_idx" ON "ExternalAccount"("userId", "provider");

-- CreateIndex
CREATE INDEX "ExternalAccount_provider_providerEmail_idx" ON "ExternalAccount"("provider", "providerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAccount_provider_providerAccountId_key" ON "ExternalAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionTokenHash_key" ON "Session"("sessionTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MfaFactor_credentialId_key" ON "MfaFactor"("credentialId");

-- CreateIndex
CREATE INDEX "MfaFactor_userId_type_status_idx" ON "MfaFactor"("userId", "type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key" ON "MfaRecoveryCode"("codeHash");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_userId_consumedAt_idx" ON "MfaRecoveryCode"("userId", "consumedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationToken_purpose_expiresAt_idx" ON "VerificationToken"("purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "VerificationToken_userId_purpose_idx" ON "VerificationToken"("userId", "purpose");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifierType_identifierValue_createdAt_idx" ON "LoginAttempt"("identifierType", "identifierValue", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_success_createdAt_idx" ON "LoginAttempt"("success", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "UserRole_assignedById_idx" ON "UserRole"("assignedById");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "AuditLog_category_createdAt_idx" ON "AuditLog"("category", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_username_key" ON "UserProfile"("username");

-- CreateIndex
CREATE INDEX "UserProfile_primaryRegionId_idx" ON "UserProfile"("primaryRegionId");

-- CreateIndex
CREATE INDEX "UserProfile_isLawyer_idx" ON "UserProfile"("isLawyer");

-- CreateIndex
CREATE INDEX "GamificationEvent_userId_createdAt_idx" ON "GamificationEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GamificationEvent_eventType_createdAt_idx" ON "GamificationEvent"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_awardedAt_idx" ON "UserBadge"("badgeId", "awardedAt");

-- CreateIndex
CREATE INDEX "UserBadge_awardedById_idx" ON "UserBadge"("awardedById");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_type_visibility_idx" ON "Organization"("type", "visibility");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_status_idx" ON "OrganizationMember"("userId", "status");

-- CreateIndex
CREATE INDEX "OrganizationMember_invitedById_idx" ON "OrganizationMember"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerProfile_userId_key" ON "LawyerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerProfile_barLicenseNumber_key" ON "LawyerProfile"("barLicenseNumber");

-- CreateIndex
CREATE INDEX "LawyerProfile_verificationStatus_idx" ON "LawyerProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "LawyerProfile_verifiedById_idx" ON "LawyerProfile"("verifiedById");

-- CreateIndex
CREATE INDEX "LawyerPracticeArea_categoryId_idx" ON "LawyerPracticeArea"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerPracticeArea_lawyerProfileId_categoryId_key" ON "LawyerPracticeArea"("lawyerProfileId", "categoryId");

-- CreateIndex
CREATE INDEX "LawyerVerificationRequest_status_submittedAt_idx" ON "LawyerVerificationRequest"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "LawyerVerificationRequest_reviewedById_idx" ON "LawyerVerificationRequest"("reviewedById");

-- CreateIndex
CREATE INDEX "LawyerVerificationDocument_verificationRequestId_type_idx" ON "LawyerVerificationDocument"("verificationRequestId", "type");

-- CreateIndex
CREATE INDEX "LawyerVerificationDocument_assetId_idx" ON "LawyerVerificationDocument"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_scope_isActive_sortOrder_idx" ON "Category"("scope", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Category_parentId_name_scope_key" ON "Category"("parentId", "name", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_type_isActive_idx" ON "Tag"("type", "isActive");

-- CreateIndex
CREATE INDEX "DiscussionTag_tagId_idx" ON "DiscussionTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionTag_discussionId_tagId_key" ON "DiscussionTag"("discussionId", "tagId");

-- CreateIndex
CREATE INDEX "CaseTag_tagId_idx" ON "CaseTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseTag_caseId_tagId_key" ON "CaseTag"("caseId", "tagId");

-- CreateIndex
CREATE INDEX "TagMetricDaily_metricDate_engagementScore_idx" ON "TagMetricDaily"("metricDate", "engagementScore");

-- CreateIndex
CREATE UNIQUE INDEX "TagMetricDaily_tagId_metricDate_key" ON "TagMetricDaily"("tagId", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE INDEX "Region_parentId_idx" ON "Region"("parentId");

-- CreateIndex
CREATE INDEX "Region_countryCode_type_isActive_idx" ON "Region"("countryCode", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Region_countryCode_parentId_type_name_key" ON "Region"("countryCode", "parentId", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Court_slug_key" ON "Court"("slug");

-- CreateIndex
CREATE INDEX "Court_regionId_level_idx" ON "Court"("regionId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Court_regionId_name_key" ON "Court"("regionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Discussion_slug_key" ON "Discussion"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Discussion_acceptedAnswerId_key" ON "Discussion"("acceptedAnswerId");

-- CreateIndex
CREATE INDEX "Discussion_authorId_createdAt_idx" ON "Discussion"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Discussion_organizationId_createdAt_idx" ON "Discussion"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Discussion_categoryId_regionId_status_idx" ON "Discussion"("categoryId", "regionId", "status");

-- CreateIndex
CREATE INDEX "Discussion_status_lastActivityAt_idx" ON "Discussion"("status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "Discussion_contentStatus_createdAt_idx" ON "Discussion"("contentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Discussion_relatedCaseId_idx" ON "Discussion"("relatedCaseId");

-- CreateIndex
CREATE INDEX "Answer_discussionId_createdAt_idx" ON "Answer"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "Answer_authorId_createdAt_idx" ON "Answer"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Answer_status_createdAt_idx" ON "Answer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Answer_isAccepted_idx" ON "Answer"("isAccepted");

-- CreateIndex
CREATE INDEX "Comment_discussionId_createdAt_idx" ON "Comment"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_answerId_createdAt_idx" ON "Comment"("answerId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_caseId_createdAt_idx" ON "Comment"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_authorId_createdAt_idx" ON "Comment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "DiscussionRevision_editorId_createdAt_idx" ON "DiscussionRevision"("editorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionRevision_discussionId_version_key" ON "DiscussionRevision"("discussionId", "version");

-- CreateIndex
CREATE INDEX "AnswerRevision_editorId_createdAt_idx" ON "AnswerRevision"("editorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerRevision_answerId_version_key" ON "AnswerRevision"("answerId", "version");

-- CreateIndex
CREATE INDEX "CommentRevision_editorId_createdAt_idx" ON "CommentRevision"("editorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentRevision_commentId_version_key" ON "CommentRevision"("commentId", "version");

-- CreateIndex
CREATE INDEX "DiscussionReaction_userId_idx" ON "DiscussionReaction"("userId");

-- CreateIndex
CREATE INDEX "DiscussionReaction_reactionType_idx" ON "DiscussionReaction"("reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionReaction_discussionId_userId_key" ON "DiscussionReaction"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "AnswerReaction_userId_idx" ON "AnswerReaction"("userId");

-- CreateIndex
CREATE INDEX "AnswerReaction_reactionType_idx" ON "AnswerReaction"("reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerReaction_answerId_userId_key" ON "AnswerReaction"("answerId", "userId");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "CommentReaction"("userId");

-- CreateIndex
CREATE INDEX "CommentReaction_reactionType_idx" ON "CommentReaction"("reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_key" ON "CommentReaction"("commentId", "userId");

-- CreateIndex
CREATE INDEX "DiscussionFollow_userId_createdAt_idx" ON "DiscussionFollow"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionFollow_discussionId_userId_key" ON "DiscussionFollow"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "SavedDiscussion_userId_createdAt_idx" ON "SavedDiscussion"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedDiscussion_discussionId_userId_key" ON "SavedDiscussion"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "DiscussionView_discussionId_viewedAt_idx" ON "DiscussionView"("discussionId", "viewedAt");

-- CreateIndex
CREATE INDEX "DiscussionView_userId_viewedAt_idx" ON "DiscussionView"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "DiscussionBoost_discussionId_createdAt_idx" ON "DiscussionBoost"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionBoost_userId_createdAt_idx" ON "DiscussionBoost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionBoost_boostType_createdAt_idx" ON "DiscussionBoost"("boostType", "createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_uploaderId_createdAt_idx" ON "FileAsset"("uploaderId", "createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_scanStatus_createdAt_idx" ON "FileAsset"("scanStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ContentAttachment_assetId_idx" ON "ContentAttachment"("assetId");

-- CreateIndex
CREATE INDEX "ContentAttachment_discussionId_idx" ON "ContentAttachment"("discussionId");

-- CreateIndex
CREATE INDEX "ContentAttachment_answerId_idx" ON "ContentAttachment"("answerId");

-- CreateIndex
CREATE INDEX "ContentAttachment_commentId_idx" ON "ContentAttachment"("commentId");

-- CreateIndex
CREATE INDEX "ContentAttachment_caseId_idx" ON "ContentAttachment"("caseId");

-- CreateIndex
CREATE INDEX "ContentAttachment_uploadedById_createdAt_idx" ON "ContentAttachment"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionAISummary_discussionId_isCurrent_idx" ON "DiscussionAISummary"("discussionId", "isCurrent");

-- CreateIndex
CREATE INDEX "DiscussionAISummary_status_generatedAt_idx" ON "DiscussionAISummary"("status", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionAISummary_discussionId_version_key" ON "DiscussionAISummary"("discussionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CaseRecord_slug_key" ON "CaseRecord"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CaseRecord_canonicalCitation_key" ON "CaseRecord"("canonicalCitation");

-- CreateIndex
CREATE INDEX "CaseRecord_authorId_createdAt_idx" ON "CaseRecord"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseRecord_status_publishedAt_idx" ON "CaseRecord"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "CaseRecord_primaryCategoryId_decisionDate_idx" ON "CaseRecord"("primaryCategoryId", "decisionDate");

-- CreateIndex
CREATE INDEX "CaseRecord_courtId_decisionDate_idx" ON "CaseRecord"("courtId", "decisionDate");

-- CreateIndex
CREATE INDEX "CaseRecord_organizationId_createdAt_idx" ON "CaseRecord"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseRevision_editorId_createdAt_idx" ON "CaseRevision"("editorId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseRevision_status_createdAt_idx" ON "CaseRevision"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseRevision_caseId_version_key" ON "CaseRevision"("caseId", "version");

-- CreateIndex
CREATE INDEX "CaseCitation_citedCaseId_idx" ON "CaseCitation"("citedCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseCitation_sourceCaseId_citedCaseId_key" ON "CaseCitation"("sourceCaseId", "citedCaseId");

-- CreateIndex
CREATE INDEX "CaseSourceLink_caseId_isPrimary_idx" ON "CaseSourceLink"("caseId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "CaseSourceLink_caseId_url_key" ON "CaseSourceLink"("caseId", "url");

-- CreateIndex
CREATE INDEX "CaseSourceFile_assetId_idx" ON "CaseSourceFile"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseSourceFile_caseId_assetId_key" ON "CaseSourceFile"("caseId", "assetId");

-- CreateIndex
CREATE INDEX "CaseReaction_userId_idx" ON "CaseReaction"("userId");

-- CreateIndex
CREATE INDEX "CaseReaction_reactionType_idx" ON "CaseReaction"("reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "CaseReaction_caseId_userId_key" ON "CaseReaction"("caseId", "userId");

-- CreateIndex
CREATE INDEX "SavedCase_userId_createdAt_idx" ON "SavedCase"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCase_caseId_userId_key" ON "SavedCase"("caseId", "userId");

-- CreateIndex
CREATE INDEX "CaseFollow_userId_createdAt_idx" ON "CaseFollow"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseFollow_caseId_userId_key" ON "CaseFollow"("caseId", "userId");

-- CreateIndex
CREATE INDEX "CaseView_caseId_viewedAt_idx" ON "CaseView"("caseId", "viewedAt");

-- CreateIndex
CREATE INDEX "CaseView_userId_viewedAt_idx" ON "CaseView"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "ContentReport_reporterId_createdAt_idx" ON "ContentReport"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReport_status_createdAt_idx" ON "ContentReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReport_targetType_createdAt_idx" ON "ContentReport"("targetType", "createdAt");

-- CreateIndex
CREATE INDEX "ContentReport_reviewedById_idx" ON "ContentReport"("reviewedById");

-- CreateIndex
CREATE INDEX "AIAlert_status_severity_detectedAt_idx" ON "AIAlert"("status", "severity", "detectedAt");

-- CreateIndex
CREATE INDEX "AIAlert_targetType_detectedAt_idx" ON "AIAlert"("targetType", "detectedAt");

-- CreateIndex
CREATE INDEX "AIAlert_reviewedById_idx" ON "AIAlert"("reviewedById");

-- CreateIndex
CREATE INDEX "ModerationAction_moderatorId_createdAt_idx" ON "ModerationAction"("moderatorId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_actionType_createdAt_idx" ON "ModerationAction"("actionType", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_targetUserId_idx" ON "ModerationAction"("targetUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "UserIdentifier" ADD CONSTRAINT "UserIdentifier_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalAccount" ADD CONSTRAINT "ExternalAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaFactor" ADD CONSTRAINT "MfaFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_primaryRegionId_fkey" FOREIGN KEY ("primaryRegionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGamification" ADD CONSTRAINT "UserGamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationEvent" ADD CONSTRAINT "GamificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationEvent" ADD CONSTRAINT "GamificationEvent_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationEvent" ADD CONSTRAINT "GamificationEvent_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationEvent" ADD CONSTRAINT "GamificationEvent_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamificationEvent" ADD CONSTRAINT "GamificationEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerProfile" ADD CONSTRAINT "LawyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerProfile" ADD CONSTRAINT "LawyerProfile_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerPracticeArea" ADD CONSTRAINT "LawyerPracticeArea_lawyerProfileId_fkey" FOREIGN KEY ("lawyerProfileId") REFERENCES "LawyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerPracticeArea" ADD CONSTRAINT "LawyerPracticeArea_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerVerificationRequest" ADD CONSTRAINT "LawyerVerificationRequest_lawyerProfileId_fkey" FOREIGN KEY ("lawyerProfileId") REFERENCES "LawyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerVerificationRequest" ADD CONSTRAINT "LawyerVerificationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerVerificationDocument" ADD CONSTRAINT "LawyerVerificationDocument_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "LawyerVerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LawyerVerificationDocument" ADD CONSTRAINT "LawyerVerificationDocument_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionTag" ADD CONSTRAINT "DiscussionTag_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionTag" ADD CONSTRAINT "DiscussionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTag" ADD CONSTRAINT "CaseTag_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseTag" ADD CONSTRAINT "CaseTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagMetricDaily" ADD CONSTRAINT "TagMetricDaily_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Court" ADD CONSTRAINT "Court_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_relatedCaseId_fkey" FOREIGN KEY ("relatedCaseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_acceptedAnswerId_fkey" FOREIGN KEY ("acceptedAnswerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionRevision" ADD CONSTRAINT "DiscussionRevision_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionRevision" ADD CONSTRAINT "DiscussionRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerRevision" ADD CONSTRAINT "AnswerRevision_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerRevision" ADD CONSTRAINT "AnswerRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentRevision" ADD CONSTRAINT "CommentRevision_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentRevision" ADD CONSTRAINT "CommentRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReaction" ADD CONSTRAINT "DiscussionReaction_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionReaction" ADD CONSTRAINT "DiscussionReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReaction" ADD CONSTRAINT "AnswerReaction_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReaction" ADD CONSTRAINT "AnswerReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionFollow" ADD CONSTRAINT "DiscussionFollow_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionFollow" ADD CONSTRAINT "DiscussionFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedDiscussion" ADD CONSTRAINT "SavedDiscussion_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedDiscussion" ADD CONSTRAINT "SavedDiscussion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionView" ADD CONSTRAINT "DiscussionView_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionView" ADD CONSTRAINT "DiscussionView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionBoost" ADD CONSTRAINT "DiscussionBoost_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionBoost" ADD CONSTRAINT "DiscussionBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAttachment" ADD CONSTRAINT "ContentAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionAISummary" ADD CONSTRAINT "DiscussionAISummary_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionAISummary" ADD CONSTRAINT "DiscussionAISummary_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_primaryCategoryId_fkey" FOREIGN KEY ("primaryCategoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRecord" ADD CONSTRAINT "CaseRecord_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRevision" ADD CONSTRAINT "CaseRevision_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRevision" ADD CONSTRAINT "CaseRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseRevision" ADD CONSTRAINT "CaseRevision_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseCitation" ADD CONSTRAINT "CaseCitation_sourceCaseId_fkey" FOREIGN KEY ("sourceCaseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseCitation" ADD CONSTRAINT "CaseCitation_citedCaseId_fkey" FOREIGN KEY ("citedCaseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSourceLink" ADD CONSTRAINT "CaseSourceLink_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSourceFile" ADD CONSTRAINT "CaseSourceFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseSourceFile" ADD CONSTRAINT "CaseSourceFile_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseReaction" ADD CONSTRAINT "CaseReaction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseReaction" ADD CONSTRAINT "CaseReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCase" ADD CONSTRAINT "SavedCase_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCase" ADD CONSTRAINT "SavedCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFollow" ADD CONSTRAINT "CaseFollow_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFollow" ADD CONSTRAINT "CaseFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseView" ADD CONSTRAINT "CaseView_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseView" ADD CONSTRAINT "CaseView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlert" ADD CONSTRAINT "AIAlert_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlert" ADD CONSTRAINT "AIAlert_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlert" ADD CONSTRAINT "AIAlert_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlert" ADD CONSTRAINT "AIAlert_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAlert" ADD CONSTRAINT "AIAlert_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ContentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_aiAlertId_fkey" FOREIGN KEY ("aiAlertId") REFERENCES "AIAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
