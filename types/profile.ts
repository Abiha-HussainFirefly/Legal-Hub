export type ProfileVisibility =
  | "PUBLIC"
  | "MEMBERS_ONLY"
  | "LAWYERS_ONLY"
  | "PRIVATE";

export type ConsultationAvailability =
  | "AVAILABLE"
  | "LIMITED"
  | "UNAVAILABLE";

export interface ProfileExperienceInput {
  id?: string;
  title: string;
  organization: string;
  location?: string;
  employmentType?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface ProfileEducationInput {
  id?: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProfileCertificationInput {
  id?: string;
  name: string;
  issuer?: string;
  credentialId?: string;
  credentialUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
  description?: string;
}

export interface ProfileSkillInput {
  id?: string;
  name: string;
  yearsExperience?: number | null;
}

export interface ProfileLanguageInput {
  id?: string;
  name: string;
  proficiency?: string;
}

export interface ProfileAwardInput {
  id?: string;
  title: string;
  issuer?: string;
  description?: string;
  awardUrl?: string;
  awardedAt?: string;
}

export interface ProfileSocialLinkInput {
  id?: string;
  platform: string;
  label?: string;
  url: string;
}

export interface ProfileVisibilitySettings {
  emailVisibility: ProfileVisibility;
  phoneVisibility: ProfileVisibility;
  headlineVisibility: ProfileVisibility;
  bioVisibility: ProfileVisibility;
  locationVisibility: ProfileVisibility;
  companyVisibility: ProfileVisibility;
  experienceVisibility: ProfileVisibility;
  educationVisibility: ProfileVisibility;
  certificationsVisibility: ProfileVisibility;
  skillsVisibility: ProfileVisibility;
  languagesVisibility: ProfileVisibility;
  websiteVisibility: ProfileVisibility;
  socialLinksVisibility: ProfileVisibility;
  activityAnalyticsVisibility: ProfileVisibility;
  badgesVisibility: ProfileVisibility;
}

export interface ProfileHeatmapDay {
  date: string;
  total: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  discussionCount: number;
  answerCount: number;
  commentCount: number;
  caseCount: number;
  reactionReceivedCount: number;
  profileViewCount: number;
  badgeCount: number;
  engagementScore: number;
}

export interface ProfileAnalyticsSummary {
  discussions: number;
  answers: number;
  comments: number;
  cases: number;
  acceptedAnswers: number;
  followers: number;
  reactionsReceived: number;
  profileViews: number;
  badges: number;
  points: number;
  level: number;
  postingRateLabel: string;
  trendLabel: string;
  trendDirection: "up" | "down" | "flat";
  lastContributionAt?: string | null;
}

export interface ProfileContributionLink {
  id: string;
  title: string;
  href: string;
  kind: "discussion" | "answer" | "case";
  createdAt: string;
  detail?: string | null;
  metricLabel?: string | null;
}

export interface ProfessionalProfile {
  userId: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  coverImageUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  company?: string | null;
  roleTitle?: string | null;
  city?: string | null;
  countryCode?: string | null;
  primaryRegionId?: string | null;
  regionName?: string | null;
  officeAddress?: string | null;
  websiteUrl?: string | null;
  linkedInUrl?: string | null;
  yearsExperience?: number | null;
  consultationStatus?: ConsultationAvailability | null;
  isLawyer: boolean;
  verificationStatus?: string | null;
  verifiedAt?: string | null;
  firmName?: string | null;
  barCouncil?: string | null;
  practiceAreas: Array<{ id: string; name: string; yearsExperience?: number | null; isPrimary?: boolean }>;
  experiences: ProfileExperienceInput[];
  educations: ProfileEducationInput[];
  certifications: ProfileCertificationInput[];
  skills: ProfileSkillInput[];
  languages: ProfileLanguageInput[];
  awards: ProfileAwardInput[];
  socialLinks: ProfileSocialLinkInput[];
  badges: Array<{
    id: string;
    code: string;
    name: string;
    description?: string | null;
    iconName?: string | null;
    awardedAt: string;
  }>;
  analytics: ProfileAnalyticsSummary;
  heatmap: ProfileHeatmapDay[];
  recentContributions: ProfileContributionLink[];
  completionPercentage: number;
  completionState: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  missingChecklist: string[];
  visibility: ProfileVisibilitySettings;
  createdAt?: string;
}

export interface ProfileFormInput {
  displayName: string;
  username: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  headline?: string;
  bio?: string;
  company?: string;
  roleTitle?: string;
  city?: string;
  countryCode?: string;
  primaryRegionId?: string;
  officeAddress?: string;
  websiteUrl?: string;
  linkedInUrl?: string;
  yearsExperience?: number | null;
  consultationStatus?: ConsultationAvailability | null;
  practiceAreaCategoryIds: string[];
  skills: ProfileSkillInput[];
  languages: ProfileLanguageInput[];
  experiences: ProfileExperienceInput[];
  educations: ProfileEducationInput[];
  certifications: ProfileCertificationInput[];
  awards: ProfileAwardInput[];
  socialLinks: ProfileSocialLinkInput[];
  visibility: ProfileVisibilitySettings;
}

export interface ProfileEditMeta {
  regions: Array<{ id: string; name: string }>;
  practiceAreas: Array<{ id: string; name: string }>;
}
