'use client';

import AISummaryModal from '@/app/components/lawyer/discussions/ai-summary-modal';
import AnswerCard from '@/app/components/lawyer/discussions/answercard';
import CommentThread from '@/app/components/lawyer/discussions/commentthread';
import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import LawyerTopbar from '@/app/components/lawyer/lawyer-topbar';
import AnimatedLink from '@/app/components/ui/animated-link';
import Tooltip from '@/app/components/ui/tooltip';
import { apiRequest, getErrorMessage } from '@/lib/api-client';
import { ArrowUp, ChevronRight, Eye, Loader2, MapPin, MessageSquare, Smile } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';

const EMOJI_REACTIONS = [
  { emoji: '\u{1F44D}', type: 'LIKE', label: 'Like' },
  { emoji: '\u{2764}\u{FE0F}', type: 'LOVE', label: 'Support' },
  { emoji: '\u{1F680}', type: 'INSIGHTFUL', label: 'Insightful' },
  { emoji: '\u{1F440}', type: 'HELPFUL', label: 'Follow' },
];

interface Author {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profile: {
    username: string | null;
    isLawyer: boolean;
    headline?: string | null;
    primaryRegion?: { name: string } | null;
  } | null;
  lawyerProfile: { verificationStatus: string; barCouncil: string | null; firmName: string | null } | null;
}

interface DiscussionComment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  replies?: DiscussionComment[];
}

interface Discussion {
  id: string;
  slug: string;
  kind: string;
  title: string;
  body: string;
  excerpt: string | null;
  status: string;
  score: number;
  reactionCount: number;
  answerCount: number;
  commentCount: number;
  viewCount: number;
  followerCount: number;
  bookmarkCount: number;
  isAiSummaryReady: boolean;
  acceptedAnswerId: string | null;
  createdAt: string;
  author: Author;
  category: { name: string; colorHex: string | null; iconName?: string | null };
  region: { name: string } | null;
  tags: { id: string; name: string; slug: string }[];
  comments?: DiscussionComment[];
  aiSummaries?: Array<{
    summaryText: string | null;
    mainIssue: string | null;
    keyPoints: unknown;
    expertConsensus: string | null;
    status: string;
  }>;
}

interface AnswerRow {
  id: string;
  body: string;
  status: string;
  isAccepted?: boolean;
  isExpertAnswer: boolean;
  score: number;
  reactionCount: number;
  commentCount: number;
  acceptedAt: string | null;
  createdAt: string;
  author: Author;
  comments?: DiscussionComment[];
  viewerReaction?: string | null;
}

interface DiscussionResponse {
  discussion: Discussion;
}

interface AnswersResponse {
  data?: AnswerRow[];
}

interface ReactionsResponse {
  data?: Record<string, { count: number; reactors: string[] }>;
  emojiStats?: Record<string, { count: number; reactors: string[] }>;
  viewerReaction?: {
    reactionType: string;
    emoji: string | null;
  } | null;
}

interface CurrentUser {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  headline?: string | null;
  isLawyer?: boolean;
  regionName?: string | null;
  firmName?: string | null;
  barCouncil?: string | null;
  verificationStatus?: string | null;
}

interface AuthResponse {
  authenticated: boolean;
  user?: CurrentUser;
}

function ago(value: string) {
  const date = new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function discussionTimestampLabel(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const week = 7 * 24 * 60 * 60 * 1000;
  if (diff < week) return ago(value);
  return `on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function initials(name: string | null) {
  return name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    : 'LH';
}

function kindLabel(value: string) {
  return value.toLowerCase().replaceAll('_', ' ');
}

export default function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [score, setScore] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [reactionPending, setReactionPending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiStats, setEmojiStats] = useState<Record<string, { count: number; reactors: string[] }>>({});
  const [actionPulse, setActionPulse] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [discussionComments, setDiscussionComments] = useState<DiscussionComment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCurrentUser() {
      try {
        const data = await apiRequest<AuthResponse>('/api/auth/me', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (data.authenticated) {
          setUser(data.user ?? null);
        }
      } catch {
        setUser(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsReady(true);
        }
      }
    }

    void loadCurrentUser();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadDiscussion() {
      setLoading(true);
      setPageError('');

      try {
        const [discussionResponse, answersResponse, reactionsResponse] = await Promise.all([
          apiRequest<DiscussionResponse>(`/api/discussions/${slug}`, {
            signal: controller.signal,
            cache: 'no-store',
          }),
          apiRequest<AnswersResponse>(`/api/discussions/${slug}/answers?limit=50&sort=top`, {
            signal: controller.signal,
            cache: 'no-store',
          }),
          apiRequest<ReactionsResponse>(`/api/discussions/${slug}/reactions`, {
            signal: controller.signal,
            cache: 'no-store',
          }),
        ]);

        const loadedDiscussion = discussionResponse.discussion;
        setDiscussion(loadedDiscussion);
        setScore(loadedDiscussion.score ?? 0);
        setDiscussionComments(loadedDiscussion.comments ?? []);
        setAnswers(answersResponse.data ?? []);
        setEmojiStats(reactionsResponse.data ?? {});
        setMyReaction(reactionsResponse.viewerReaction?.reactionType ?? null);
        setMyEmoji(reactionsResponse.viewerReaction?.emoji ?? null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setDiscussion(null);
          setAnswers([]);
          setPageError(getErrorMessage(error, 'Unable to load this discussion.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDiscussion();

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!actionPulse) return;
    const timeout = window.setTimeout(() => setActionPulse(false), 320);
    return () => window.clearTimeout(timeout);
  }, [actionPulse]);

  async function updateReaction(body: { reactionType: string; emoji?: string }) {
    if (!user || !discussion || reactionPending) return;

    setReactionPending(true);

    try {
      const data = await apiRequest<ReactionsResponse & { score?: number }>(`/api/discussions/${discussion.slug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setScore(data.score ?? score);
      setMyReaction(data.viewerReaction?.reactionType ?? null);
      setMyEmoji(data.viewerReaction?.emoji ?? null);
      setEmojiStats(data.data ?? data.emojiStats ?? {});
      setShowEmojiPicker(false);
      setActionPulse(true);
    } catch {
      // Keep current state if the mutation fails.
    } finally {
      setReactionPending(false);
    }
  }

  async function postAnswer() {
    if (!answerText.trim() || posting || !user || !discussion) return;

    setPosting(true);
    setPostError('');

    try {
      const data = await apiRequest<{ answer: AnswerRow }>(`/api/discussions/${discussion.slug}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: answerText }),
      });

      setAnswers((current) => [...current, { ...data.answer, isAccepted: false, viewerReaction: null, comments: [] }]);
      setAnswerText('');
    } catch (error) {
      setPostError(getErrorMessage(error, 'Failed to post answer.'));
    } finally {
      setPosting(false);
    }
  }

  async function handleLogout() {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    router.replace('/lawyerlogin');
  }

  if (loading || !isReady) {
    return (
      <div className="legal-workspace-shell flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E3DBE9] border-t-[#4C2F5E]" />
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="legal-workspace-shell flex flex-col items-center justify-center gap-4">
        <p className="text-[#736683]">{pageError || 'Discussion not found.'}</p>
        <AnimatedLink href="/discussions" className="text-sm font-semibold text-[#4C2F5E]">
          Back to discussions
        </AnimatedLink>
      </div>
    );
  }

  const aiSummary = discussion.aiSummaries?.[0] ?? null;
  const isVerified = discussion.author.lawyerProfile?.verificationStatus === 'VERIFIED';
  const isResolved = discussion.status === 'RESOLVED';
  const activeEmojis = Object.entries(emojiStats);
  const authorProfileHref = `/profile/user/${discussion.author.id}`;
  const currentUserAuthor = user?.id
    ? {
        id: user.id,
        displayName: user.displayName ?? user.name ?? 'You',
        avatarUrl: user.avatarUrl ?? null,
        profile: {
          username: user.username ?? null,
          isLawyer: user.isLawyer ?? false,
          headline: user.headline ?? null,
          primaryRegion: user.regionName ? { name: user.regionName } : null,
        },
        lawyerProfile: user.isLawyer
          ? {
              verificationStatus: user.verificationStatus ?? 'PENDING',
              barCouncil: user.barCouncil ?? null,
              firmName: user.firmName ?? null,
            }
          : null,
      }
    : null;

  const participants = Array.from(
    new Map([
      [discussion.author.id, discussion.author],
      ...answers.map((answer) => [answer.author.id, answer.author] as [string, Author]),
    ]).values(),
  );

  const breadcrumbItems = [
    { label: 'Discussions', href: '/discussions' },
    ...(discussion.category?.name
      ? [{ label: discussion.category.name, href: `/discussions?category=${encodeURIComponent(discussion.category.name)}` }]
      : []),
    { label: discussion.title, href: null as string | null },
  ];

  return (
    <div className="legal-workspace-shell">
      <LawyerTopbar activeTab="discussions" user={user} onLogout={handleLogout} />

      <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-6 lg:px-8 lh-page-enter">
        <nav aria-label="Breadcrumb" className="mb-5 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-2 text-sm">
            {breadcrumbItems.map((item, index) => {
              const isCurrent = index === breadcrumbItems.length - 1;

              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 ? <ChevronRight className="h-4 w-4 text-[#A294B1]" /> : null}
                  {item.href && !isCurrent ? (
                    <AnimatedLink href={item.href} className="font-medium text-[#736683] transition hover:text-[#4C2F5E]">
                      {item.label}
                    </AnimatedLink>
                  ) : (
                    <span className={isCurrent ? 'font-semibold text-[#2F1D3B]' : 'font-medium text-[#736683]'}>
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {pageError ? (
          <div className="mb-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <section className="workspace-sidebar p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="workspace-pill">{discussion.category.name}</span>
                {discussion.region ? (
                  <span className="workspace-pill border-[#2F1D3B]/8 bg-white text-[#736683]">
                    <MapPin className="h-3.5 w-3.5" />
                    {discussion.region.name}
                  </span>
                ) : null}
                <span className={`workspace-pill ${isResolved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#2F1D3B]/8 bg-white text-[#736683]'}`}>
                  {isResolved ? 'Answered' : kindLabel(discussion.kind)}
                </span>
                {discussion.isAiSummaryReady ? <span className="workspace-pill border-[#4C2F5E]/12 bg-[#4C2F5E] text-white">AI summary</span> : null}
                {discussion.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full border border-[#2F1D3B]/8 bg-[#F8F6FB] px-2.5 py-1 text-[11px] font-medium text-[#6B5C79]">
                    #{tag.name}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.04em] text-[#2F1D3B] md:text-[2.35rem]">
                    {discussion.title}
                  </h1>

                  <div className="mt-4">
                    <ProfileHoverLink
                      href={authorProfileHref}
                      displayName={discussion.author.displayName}
                      username={discussion.author.profile?.username}
                      avatarUrl={discussion.author.avatarUrl}
                      isVerified={isVerified}
                      isLawyer={discussion.author.profile?.isLawyer ?? false}
                      headline={discussion.author.profile?.headline}
                      firmName={discussion.author.lawyerProfile?.firmName}
                      barCouncil={discussion.author.lawyerProfile?.barCouncil}
                      region={discussion.author.profile?.primaryRegion?.name ?? discussion.region?.name ?? null}
                      className="flex items-center gap-3"
                    >
                      {discussion.author.avatarUrl ? (
                        <img
                          src={discussion.author.avatarUrl}
                          alt={discussion.author.displayName ?? 'Discussion author'}
                          className="h-11 w-11 rounded-full border border-[#2F1D3B]/8 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4C2F5E] text-sm font-semibold text-white">
                          {initials(discussion.author.displayName)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-[#2F1D3B]">{discussion.author.displayName ?? 'Anonymous'}</span>
                          <span className="text-[#A294B1]">•</span>
                          <span className="text-[#736683]">{discussionTimestampLabel(discussion.createdAt)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8B7D99]">
                          {isVerified ? <span className="rounded-full bg-[#F1EAF6] px-2 py-0.5 font-semibold text-[#4C2F5E]">Verified</span> : null}
                          {discussion.author.lawyerProfile?.barCouncil ? <span>{discussion.author.lawyerProfile.barCouncil}</span> : null}
                          {discussion.author.lawyerProfile?.firmName ? <span>{discussion.author.lawyerProfile.firmName}</span> : null}
                        </div>
                      </div>
                    </ProfileHoverLink>
                  </div>
                </div>

                {discussion.isAiSummaryReady ? (
                  <button onClick={() => setIsModalOpen(true)} className="legal-button-primary text-sm">
                    View AI summary
                  </button>
                ) : null}
              </div>

              <div className="mt-6 border-t border-[#2F1D3B]/8 pt-6">
                <div className="whitespace-pre-wrap text-sm leading-7 text-[#4f5e6d]">{discussion.body}</div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#2F1D3B]/8 pt-4">
                <button
                  onClick={() => updateReaction({ reactionType: 'UPVOTE' })}
                  disabled={!user || reactionPending}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    myReaction === 'UPVOTE' && !myEmoji
                      ? 'border-[#4C2F5E]/16 bg-[#F1EAF6] text-[#4C2F5E]'
                      : 'border-[#2F1D3B]/8 bg-white text-[#6B5C79] hover:bg-[#F8F6FB]'
                  } ${actionPulse ? 'lh-action-bump' : ''}`}
                >
                  <ArrowUp className="h-4 w-4" />
                  {score}
                </button>

                <div className="relative" ref={emojiRef}>
                  <Tooltip content="React">
                    <button
                      onClick={() => {
                        if (user) setShowEmojiPicker((current) => !current);
                      }}
                      disabled={!user}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2F1D3B]/8 bg-white text-[#6B5C79] transition hover:bg-[#F8F6FB] disabled:opacity-40"
                      aria-label="React"
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                  </Tooltip>

                  {showEmojiPicker ? (
                    <div className="absolute bottom-12 left-0 z-20 flex items-center gap-1 rounded-full border border-[#2F1D3B]/8 bg-white p-1.5 shadow-[0_12px_26px_rgba(76,47,94,0.08)] lh-form-enter">
                      {EMOJI_REACTIONS.map((reaction) => (
                        <Tooltip key={reaction.emoji} content={reaction.label}>
                          <button
                            onClick={() => updateReaction({ reactionType: reaction.type, emoji: reaction.emoji })}
                            className={`rounded-full p-2 text-base transition hover:bg-[#F8F6FB] ${myEmoji === reaction.emoji ? 'bg-[#F1EAF6]' : ''}`}
                            aria-label={reaction.label}
                          >
                            {reaction.emoji}
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  ) : null}
                </div>

                {activeEmojis.map(([emoji, stat]) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      const found = EMOJI_REACTIONS.find((reaction) => reaction.emoji === emoji);
                      if (found) {
                        void updateReaction({ reactionType: found.type, emoji });
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      myEmoji === emoji
                        ? 'border-[#4C2F5E]/16 bg-[#F1EAF6] text-[#4C2F5E]'
                        : 'border-[#2F1D3B]/8 bg-white text-[#6B5C79] hover:bg-[#F8F6FB]'
                    } ${actionPulse ? 'lh-action-bump' : ''}`}
                  >
                    <span>{emoji}</span>
                    {stat.count}
                  </button>
                ))}

                <span className="inline-flex items-center gap-2 rounded-full border border-[#2F1D3B]/8 bg-[#F8F6FB] px-3 py-2 text-sm font-semibold text-[#6B5C79]">
                  <MessageSquare className="h-4 w-4" />
                  {answers.length} answers
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-[#2F1D3B]/8 bg-[#F8F6FB] px-3 py-2 text-sm font-semibold text-[#6B5C79]">
                  <Eye className="h-4 w-4" />
                  {discussion.viewCount}
                </span>
              </div>

              {discussion.commentCount > 0 || user ? (
                <div className="mt-6 border-t border-[#2F1D3B]/8 pt-5">
                  <CommentThread comments={discussionComments} discussionId={discussion.slug} currentUser={currentUserAuthor} />
                </div>
              ) : null}
            </section>

            <div id="answers" className="mt-6 rounded-[18px] border border-[#2F1D3B]/8 bg-white px-4 py-4 shadow-[0_10px_22px_rgba(16,27,40,0.03)]">
              <div className="flex items-center gap-2 text-[#4C2F5E]">
                <MessageSquare className="h-5 w-5" />
                <h2 className="text-xl font-semibold">{answers.length} Answers</h2>
              </div>
              <p className="mt-2 text-sm text-[#736683]">
                Practical, readable answers first. Accepted responses remain clearly marked in the thread.
              </p>
            </div>

            {answers.length === 0 ? (
              <div className="workspace-sidebar mt-4 px-6 py-10 text-center text-sm text-[#736683]">
                No answers yet. Be the first to help.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {answers.map((answer) => (
                  <AnswerCard
                    key={answer.id}
                    id={answer.id}
                    body={answer.body}
                    status={answer.status}
                    isAccepted={answer.isAccepted || answer.id === discussion.acceptedAnswerId}
                    isExpertAnswer={answer.isExpertAnswer}
                    score={answer.score}
                    reactionCount={answer.reactionCount}
                    commentCount={answer.commentCount}
                    acceptedAt={answer.acceptedAt}
                    createdAt={answer.createdAt}
                    author={answer.author}
                    comments={answer.comments ?? []}
                    userReaction={answer.viewerReaction ?? null}
                    discussionAuthorId={discussion.author.id}
                    currentUserId={user?.id}
                    currentUser={currentUserAuthor}
                    discussionId={discussion.id}
                    isDiscussionResolved={discussion.status === 'RESOLVED'}
                  />
                ))}
              </div>
            )}

            <section className="workspace-sidebar mt-6 p-5 md:p-6">
              <h3 className="text-lg font-semibold text-[#2F1D3B]">Your answer</h3>

              {!user ? (
                <div className="py-6">
                  <p className="text-sm text-[#736683]">You must be signed in to answer.</p>
                  <AnimatedLink href="/lawyerlogin" className="legal-button-primary mt-4 text-sm">
                    Sign in to answer
                  </AnimatedLink>
                </div>
              ) : discussion.status === 'LOCKED' ? (
                <p className="mt-4 text-sm text-[#736683]">This discussion is locked and no longer accepts answers.</p>
              ) : (
                <>
                  <textarea
                    value={answerText}
                    onChange={(event) => setAnswerText(event.target.value)}
                    placeholder="Share the legal reasoning, practical steps, and any caution the reader should know."
                    className="legal-field mt-4 h-40 resize-none p-4"
                  />

                  {postError ? (
                    <p className="mt-3 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {postError}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-[#736683]">Keep the answer clear enough for non-technical readers and specific enough for legal review.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAnswerText('')}
                        className="rounded-[14px] border border-[#2F1D3B]/8 bg-white px-4 py-2.5 text-sm font-semibold text-[#6B5C79] transition hover:bg-[#F8F6FB]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={postAnswer}
                        disabled={posting || !answerText.trim()}
                        className="inline-flex items-center gap-2 rounded-[14px] border border-[#4C2F5E] bg-[#4C2F5E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#432853] disabled:opacity-60"
                      >
                        {posting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          'Post answer'
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="workspace-sidebar p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Thread overview</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Status</p>
                  <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    isResolved ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-[#2F1D3B]/8 bg-[#F8F6FB] text-[#6B5C79]'
                  }`}>
                    {isResolved ? 'Answered' : kindLabel(discussion.kind)}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Category</p>
                  <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{discussion.category.name}</p>
                </div>

                {discussion.region ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Region</p>
                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-[#6B5C79]">
                      <MapPin className="h-4 w-4 text-[#4C2F5E]" />
                      {discussion.region.name}
                    </div>
                  </div>
                ) : null}

                <div className="border-t border-[#2F1D3B]/8 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Thread stats</p>
                  <div className="mt-3 space-y-3">
                    {[
                      ['Views', discussion.viewCount],
                      ['Answers', answers.length],
                      ['Score', score],
                      ['Followers', discussion.followerCount],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-[#736683]">{label}</span>
                        <span className="font-semibold text-[#2F1D3B]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {participants.length > 0 ? (
              <div className="workspace-sidebar p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Participants</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {participants.slice(0, 18).map((author) => (
                    <ProfileHoverLink
                      key={author.id}
                      href={`/profile/user/${author.id}`}
                      displayName={author.displayName}
                      username={author.profile?.username}
                      avatarUrl={author.avatarUrl}
                      isVerified={author.lawyerProfile?.verificationStatus === 'VERIFIED'}
                      isLawyer={author.profile?.isLawyer ?? false}
                      headline={author.profile?.headline}
                      firmName={author.lawyerProfile?.firmName}
                      barCouncil={author.lawyerProfile?.barCouncil}
                      region={author.profile?.primaryRegion?.name ?? null}
                      panelPosition="top"
                    >
                      {author.avatarUrl ? (
                        <img src={author.avatarUrl} alt={author.displayName ?? 'Participant'} className="h-10 w-10 rounded-full border border-[#2F1D3B]/8 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C2F5E] text-xs font-semibold text-white">
                          {initials(author.displayName)}
                        </div>
                      )}
                    </ProfileHoverLink>
                  ))}
                </div>
                {participants.length > 18 ? <p className="mt-3 text-xs text-[#8B7D99]">and {participants.length - 18} others</p> : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <AISummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summaryData={aiSummary}
        discussionTitle={discussion.title}
      />
    </div>
  );
}

