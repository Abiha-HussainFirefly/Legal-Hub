-- CreateEnum
CREATE TYPE "ProfileVisibilityLevel" AS ENUM ('PUBLIC', 'MEMBERS_ONLY', 'LAWYERS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ProfileCompletionState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ConsultationAvailability" AS ENUM ('AVAILABLE', 'LIMITED', 'UNAVAILABLE');

-- AlterTable
ALTER TABLE "UserProfile"
ADD COLUMN "roleTitle" TEXT,
ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "officeAddress" TEXT,
ADD COLUMN "yearsExperience" INTEGER,
ADD COLUMN "consultationStatus" "ConsultationAvailability",
ADD COLUMN "completionPercentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "completionState" "ProfileCompletionState" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "onboardingStep" TEXT,
ADD COLUMN "onboardingChecklist" JSONB,
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserProfileVisibility" (
  "userId" TEXT NOT NULL,
  "emailVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'MEMBERS_ONLY',
  "phoneVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PRIVATE',
  "headlineVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "bioVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "locationVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "companyVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "experienceVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "educationVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "certificationsVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "skillsVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "languagesVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "websiteVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "socialLinksVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "activityAnalyticsVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "badgesVisibility" "ProfileVisibilityLevel" NOT NULL DEFAULT 'PUBLIC',
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserProfileVisibility_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserExperience" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "organization" TEXT NOT NULL,
  "location" TEXT,
  "employmentType" TEXT,
  "description" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEducation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "degree" TEXT,
  "fieldOfStudy" TEXT,
  "description" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCertification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "issuer" TEXT,
  "credentialId" TEXT,
  "credentialUrl" TEXT,
  "issuedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSkill" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "yearsExperience" INTEGER,
  "endorsementCount" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLanguage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "proficiency" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAward" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "issuer" TEXT,
  "description" TEXT,
  "awardUrl" TEXT,
  "awardedAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSocialLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "label" TEXT,
  "url" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfileView" (
  "id" TEXT NOT NULL,
  "profileUserId" TEXT NOT NULL,
  "viewerUserId" TEXT,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "referer" TEXT,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivityDaily" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "activityDate" TIMESTAMP(3) NOT NULL,
  "discussionCount" INTEGER NOT NULL DEFAULT 0,
  "answerCount" INTEGER NOT NULL DEFAULT 0,
  "commentCount" INTEGER NOT NULL DEFAULT 0,
  "caseCount" INTEGER NOT NULL DEFAULT 0,
  "reactionReceivedCount" INTEGER NOT NULL DEFAULT 0,
  "profileViewCount" INTEGER NOT NULL DEFAULT 0,
  "badgeCount" INTEGER NOT NULL DEFAULT 0,
  "engagementScore" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserActivityDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserExperience_userId_sortOrder_idx" ON "UserExperience"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "UserEducation_userId_sortOrder_idx" ON "UserEducation"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "UserCertification_userId_sortOrder_idx" ON "UserCertification"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UserSkill_userId_name_key" ON "UserSkill"("userId", "name");

-- CreateIndex
CREATE INDEX "UserSkill_name_idx" ON "UserSkill"("name");

-- CreateIndex
CREATE INDEX "UserSkill_userId_sortOrder_idx" ON "UserSkill"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UserLanguage_userId_name_key" ON "UserLanguage"("userId", "name");

-- CreateIndex
CREATE INDEX "UserLanguage_userId_sortOrder_idx" ON "UserLanguage"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "UserAward_userId_sortOrder_idx" ON "UserAward"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "UserSocialLink_userId_sortOrder_idx" ON "UserSocialLink"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "UserProfileView_profileUserId_viewedAt_idx" ON "UserProfileView"("profileUserId", "viewedAt");

-- CreateIndex
CREATE INDEX "UserProfileView_viewerUserId_viewedAt_idx" ON "UserProfileView"("viewerUserId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserActivityDaily_userId_activityDate_key" ON "UserActivityDaily"("userId", "activityDate");

-- CreateIndex
CREATE INDEX "UserActivityDaily_activityDate_idx" ON "UserActivityDaily"("activityDate");

-- CreateIndex
CREATE INDEX "UserActivityDaily_userId_activityDate_idx" ON "UserActivityDaily"("userId", "activityDate");

-- Backfill visibility rows for existing users
INSERT INTO "UserProfileVisibility" ("userId", "updatedAt")
SELECT "id", CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("userId") DO NOTHING;

-- AddForeignKey
ALTER TABLE "UserProfileVisibility"
ADD CONSTRAINT "UserProfileVisibility_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExperience"
ADD CONSTRAINT "UserExperience_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEducation"
ADD CONSTRAINT "UserEducation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCertification"
ADD CONSTRAINT "UserCertification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSkill"
ADD CONSTRAINT "UserSkill_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLanguage"
ADD CONSTRAINT "UserLanguage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAward"
ADD CONSTRAINT "UserAward_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSocialLink"
ADD CONSTRAINT "UserSocialLink_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileView"
ADD CONSTRAINT "UserProfileView_profileUserId_fkey"
FOREIGN KEY ("profileUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileView"
ADD CONSTRAINT "UserProfileView_viewerUserId_fkey"
FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityDaily"
ADD CONSTRAINT "UserActivityDaily_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
