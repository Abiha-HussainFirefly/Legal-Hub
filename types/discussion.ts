// types/discussion.ts
export type DiscussionType    = 'QUESTION' | 'DISCUSSION' | 'ANNOUNCEMENT' | 'LEGAL_UPDATE';
export type DiscussionStatus  = 'OPEN' | 'RESOLVED' | 'CLOSED' | 'LOCKED' | 'HIDDEN' | 'DELETED';
export type ContentVisibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | 'ORGANIZATION';
export type ContentStatus     = 'DRAFT' | 'ACTIVE' | 'PENDING_MODERATION' | 'FLAGGED' | 'HIDDEN' | 'REMOVED' | 'DELETED';
export type ReactionType      = 'LIKE' | 'UPVOTE' | 'DOWNVOTE' | 'HELPFUL' | 'INSIGHTFUL' | 'LOVE' | 'HAPPY' | 'UNHAPPY';
export type NotificationType  =
  | 'NEW_ANSWER' | 'ANSWER_ACCEPTED' | 'DISCUSSION_FOLLOWED'
  | 'DISCUSSION_MENTIONED' | 'COMMENT_REPLIED' | 'CASE_PUBLISHED'
  | 'CASE_UPDATED' | 'CASE_COMMENTED' | 'BADGE_AWARDED'
  | 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED'
  | 'REPORT_UPDATE' | 'AI_SUMMARY_READY' | 'ORGANIZATION_INVITE' | 'SYSTEM';

export interface DiscussionAuthor {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profile: { username: string | null; isLawyer: boolean } | null;
  lawyerProfile: { verificationStatus: string; barCouncil: string | null; firmName: string | null } | null;
}

export interface CategorySummary { id: string; name: string; slug: string; colorHex: string | null; iconName: string | null; }
export interface RegionSummary   { id: string; name: string; slug: string; }
export interface TagSummary      { id: string; name: string; slug: string; }

export interface AISummary {
  summaryText: string | null; mainIssue: string | null;
  keyPoints: unknown; expertConsensus: string | null; status: string;
}

export interface DiscussionListItem {
  id: string; slug: string; kind: DiscussionType; title: string; excerpt: string | null;
  status: DiscussionStatus; visibility: ContentVisibility; contentStatus: ContentStatus;
  score: number; reactionCount: number; answerCount: number; commentCount: number;
  viewCount: number; followerCount: number; bookmarkCount: number; boostCount: number;
  isPinned: boolean; isAiSummaryReady: boolean;
  lastActivityAt: string; createdAt: string;
  author: DiscussionAuthor;
  category: CategorySummary;
  region: RegionSummary | null;
  tags: { tag: TagSummary }[];
  // reactions include emoji field from schema
  reactions?: { reactionType: ReactionType; emoji: string | null }[];
  userReaction?: ReactionType | null;
  isFollowing?: boolean;
  isSaved?: boolean;
}

export interface CreateDiscussionInput {
  title: string; body: string; excerpt?: string;
  kind: DiscussionType; categoryId: string; regionId?: string;
  visibility?: ContentVisibility; tagIds?: string[];
  sourceUrl?: string; effectiveDate?: string;
}

export interface UpdateDiscussionInput {
  title?: string; body?: string; excerpt?: string; tagIds?: string[];
  visibility?: ContentVisibility; sourceUrl?: string;
  effectiveDate?: string; changeSummary?: string;
}

export interface CreateAnswerInput  { body: string; }
export interface CreateCommentInput { body: string; parentId?: string; }


export interface ReactInput {
  reactionType: ReactionType;
  emoji?: string | null; // e.g. '👍', '❤️', null for upvote/downvote
}

export interface DiscussionFilters {
  kind?: DiscussionType; categoryId?: string; regionId?: string; tagId?: string;
  status?: DiscussionStatus; authorId?: string; search?: string;
  savedByUserId?: string;
  page?: number; limit?: number;
  sort?: 'latest' | 'popular' | 'unanswered' | 'trending';
  aiSummaryOnly?: boolean;
}
