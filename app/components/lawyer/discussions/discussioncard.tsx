'use client';

import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import AnimatedLink from '@/app/components/ui/animated-link';
import Tooltip from '@/app/components/ui/tooltip';
import { apiRequest } from '@/lib/api-client';
import { applyOptimisticDiscussionReaction } from '@/lib/discussion-reaction-state';
import { ArrowUp, Bookmark, BookmarkCheck, Check, Eye, MapPin, MessageSquare, Share2, Smile } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  lawyerProfile: {
    verificationStatus: string;
    barCouncil?: string | null;
    firmName?: string | null;
  } | null;
}

interface Props {
  id: string;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  status: string;
  score: number;
  reactionCount: number;
  answerCount: number;
  viewCount: number;
  isPinned: boolean;
  isAiSummaryReady: boolean;
  createdAt: string;
  author: Author;
  category: { name: string; colorHex?: string | null };
  region: { name: string } | null;
  tags: { tag: { id: string; name: string } }[];
  userReaction?: { reactionType: string; emoji: string | null } | null;
  isSaved?: boolean;
  isLoggedIn: boolean;
  initialEmojiStats?: Record<string, { count: number; reactors: string[] }>;
}

interface ReactionResponse {
  score?: number;
  reactionCount?: number;
  viewerReaction?: {
    reactionType: string;
    emoji: string | null;
  } | null;
}

const EMOJI_REACTIONS = [
  { emoji: '\u{1F44D}', type: 'LIKE', label: 'Like' },
  { emoji: '\u{2764}\u{FE0F}', type: 'LOVE', label: 'Support' },
  { emoji: '\u{1F680}', type: 'INSIGHTFUL', label: 'Insightful' },
  { emoji: '\u{1F440}', type: 'HELPFUL', label: 'Follow' },
];

function timeAgo(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function initials(name: string | null) {
  if (!name) return 'LH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function DiscussionCard({
  slug,
  kind,
  title,
  excerpt,
  status,
  score,
  answerCount,
  viewCount,
  isPinned,
  isAiSummaryReady,
  createdAt,
  author,
  category,
  region,
  tags,
  userReaction: initialReaction = null,
  isSaved: initialSaved = false,
  isLoggedIn,
  initialEmojiStats = {},
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [savePending, setSavePending] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(initialReaction?.reactionType ?? null);
  const [myEmoji, setMyEmoji] = useState<string | null>(initialReaction?.emoji ?? null);
  const [reactionPending, setReactionPending] = useState(false);
  const [currentScore, setCurrentScore] = useState(score);
  const [copied, setCopied] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiStats, setEmojiStats] = useState(initialEmojiStats);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  useEffect(() => {
    setCurrentScore(score);
  }, [score]);

  useEffect(() => {
    setMyReaction(initialReaction?.reactionType ?? null);
    setMyEmoji(initialReaction?.emoji ?? null);
  }, [initialReaction]);

  useEffect(() => {
    setEmojiStats(initialEmojiStats);
  }, [initialEmojiStats]);

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

  async function updateReaction(body: { reactionType: string; emoji?: string }) {
    if (!isLoggedIn || reactionPending) return;

    const previousState = {
      score: currentScore,
      reaction: myReaction ? { reactionType: myReaction, emoji: myEmoji } : null,
      emojiStats,
    };
    const optimisticState = applyOptimisticDiscussionReaction({
      score: currentScore,
      viewerReaction: previousState.reaction,
      emojiStats,
      nextReaction: body,
    });

    setCurrentScore(optimisticState.score);
    setMyReaction(optimisticState.viewerReaction?.reactionType ?? null);
    setMyEmoji(optimisticState.viewerReaction?.emoji ?? null);
    setEmojiStats(optimisticState.emojiStats);
    setReactionPending(true);

    try {
      const data = await apiRequest<ReactionResponse>(`/api/discussions/${slug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setCurrentScore(data.score ?? optimisticState.score);
      setMyReaction(data.viewerReaction?.reactionType ?? null);
      setMyEmoji(data.viewerReaction?.emoji ?? null);
      setShowEmojiPicker(false);
    } catch {
      setCurrentScore(previousState.score);
      setMyReaction(previousState.reaction?.reactionType ?? null);
      setMyEmoji(previousState.reaction?.emoji ?? null);
      setEmojiStats(previousState.emojiStats);
    } finally {
      setReactionPending(false);
    }
  }

  async function handleBookmark(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn || savePending) return;

    const previousValue = saved;
    setSavePending(true);
    setSaved(!previousValue);

    try {
      await apiRequest(`/api/discussions/${slug}/bookmark`, { method: 'POST' });
    } catch {
      setSaved(previousValue);
    } finally {
      setSavePending(false);
    }
  }

  async function handleShare(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/discussions/${slug}`;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const isResolved = status === 'RESOLVED';
  const isVerified = author.lawyerProfile?.verificationStatus === 'VERIFIED';
  const authorProfileHref = `/profile/user/${author.id}`;
  const activeEmojiEntries = Object.entries(emojiStats);

  return (
    <article className="border-b border-[#2F1D3B]/8 bg-white last:border-b-0">
      <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="hidden w-[84px] shrink-0 flex-col items-center gap-2 sm:flex">
          <button
            onClick={() => updateReaction({ reactionType: 'UPVOTE' })}
            disabled={!isLoggedIn || reactionPending}
            className={`flex w-full flex-col items-center rounded-[14px] border px-3 py-2.5 text-center transition ${
              myReaction === 'UPVOTE' && !myEmoji
                ? 'border-[#4C2F5E]/16 bg-[#F1EAF6] text-[#4C2F5E]'
                : 'border-[#2F1D3B]/10 bg-white text-[#5E516B] hover:bg-[#F8F6FB]'
            }`}
          >
            <ArrowUp className="h-4 w-4" />
            <span className="mt-1 text-sm font-semibold">{currentScore}</span>
          </button>

          <div className={`w-full rounded-[14px] border px-2 py-2 text-center ${
            isResolved ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-[#2F1D3B]/10 bg-[#FBF9FD] text-[#5E516B]'
          }`}>
            <p className="text-sm font-semibold">{answerCount}</p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase leading-4 tracking-[0.06em]">
              {isResolved ? 'Answered' : 'Replies'}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#4C2F5E]/10 bg-[#F8F6FB] px-2.5 py-1 text-[11px] font-semibold text-[#4C2F5E]">
              {category.name}
            </span>
            <span className="rounded-full border border-[#2F1D3B]/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6B5C79]">
              {kind.replaceAll('_', ' ')}
            </span>
            {region ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#2F1D3B]/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6B5C79]">
                <MapPin className="h-3 w-3" />
                {region.name}
              </span>
            ) : null}
            {isPinned ? (
              <span className="rounded-full border border-[#D8C28C]/30 bg-[#F8F1DF] px-2.5 py-1 text-[11px] font-semibold text-[#8A6928]">
                Pinned
              </span>
            ) : null}
            {isAiSummaryReady ? (
              <span className="rounded-full border border-[#4C2F5E]/12 bg-[#4C2F5E] px-2.5 py-1 text-[11px] font-semibold text-white">
                AI summary
              </span>
            ) : null}
          </div>

          <AnimatedLink href={`/discussions/${slug}`} className="mt-3 block">
            <h3 className="text-[1.1rem] font-semibold leading-7 tracking-[-0.02em] text-[#2F1D3B] transition hover:text-[#4C2F5E]">
              {title}
            </h3>
          </AnimatedLink>

          <p className="mt-1.5 text-sm text-[#736683]">
            <span className="font-medium text-[#5E516B]">{author.displayName ?? 'Anonymous'}</span>
            {' '}asked {timeAgo(createdAt)} in {category.name}
            {' · '}
            {isResolved ? 'Answered' : 'Unanswered'}
          </p>

          {excerpt ? (
            <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-[#736683]">{excerpt}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.tag.id}
                  className="rounded-full bg-[#FBF9FD] px-2.5 py-1 text-[11px] font-medium text-[#7B6D89]"
                >
                  #{tag.tag.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ProfileHoverLink
              href={authorProfileHref}
              displayName={author.displayName}
              username={author.profile?.username}
              avatarUrl={author.avatarUrl}
              isVerified={isVerified}
              isLawyer={author.profile?.isLawyer ?? false}
              headline={author.profile?.headline}
              firmName={author.lawyerProfile?.firmName}
              barCouncil={author.lawyerProfile?.barCouncil}
              region={author.profile?.primaryRegion?.name ?? region?.name ?? null}
              className="flex min-w-0 items-center gap-3"
              panelPosition="top"
            >
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.displayName ?? 'Discussion author'}
                  className="h-8 w-8 rounded-full border border-[#4C2F5E]/8 object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4C2F5E] text-[11px] font-semibold text-white">
                  {initials(author.displayName)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-[#4C2F5E]">{author.displayName ?? 'Anonymous'}</span>
                  {isVerified ? (
                    <span className="rounded-full bg-[#F1EAF6] px-2 py-0.5 text-[10px] font-semibold text-[#4C2F5E]">Verified</span>
                  ) : null}
                </div>
              </div>
            </ProfileHoverLink>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative" ref={emojiRef}>
                <Tooltip content="React">
                  <button
                    onClick={() => {
                      if (isLoggedIn) setShowEmojiPicker((current) => !current);
                    }}
                    disabled={!isLoggedIn}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2F1D3B]/10 bg-white text-[#6B5C79] transition hover:bg-[#F8F6FB] disabled:opacity-40"
                    aria-label="React"
                  >
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>

                {showEmojiPicker ? (
                  <div className="absolute bottom-11 right-0 z-20 flex items-center gap-1 rounded-full border border-[#4C2F5E]/8 bg-white p-1.5 shadow-[0_12px_26px_rgba(76,47,94,0.08)] lh-form-enter">
                    {EMOJI_REACTIONS.map((reaction) => (
                      <Tooltip key={reaction.emoji} content={reaction.label}>
                        <button
                          onClick={() => updateReaction({ reactionType: reaction.type, emoji: reaction.emoji })}
                          className={`rounded-full p-2 text-base transition hover:bg-[#F8F6FB] ${
                            myEmoji === reaction.emoji ? 'bg-[#F1EAF6]' : ''
                          }`}
                          aria-label={reaction.label}
                        >
                          {reaction.emoji}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                ) : null}
              </div>

              {activeEmojiEntries.slice(0, 2).map(([emoji, stat]) => (
                <button
                  key={emoji}
                  onClick={() => {
                    const match = EMOJI_REACTIONS.find((item) => item.emoji === emoji);
                    if (match) {
                      void updateReaction({ reactionType: match.type, emoji });
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
                    myEmoji === emoji
                      ? 'border-[#4C2F5E]/16 bg-[#F1EAF6] text-[#4C2F5E]'
                      : 'border-[#2F1D3B]/10 bg-white text-[#6B5C79] hover:bg-[#F8F6FB]'
                  }`}
                >
                  <span>{emoji}</span>
                  {stat.count}
                </button>
              ))}

              <AnimatedLink
                href={`/discussions/${slug}#answers`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2F1D3B]/10 bg-white px-3 py-2 text-xs font-semibold text-[#5E516B] transition hover:bg-[#F8F6FB]"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {answerCount}
              </AnimatedLink>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2F1D3B]/10 bg-[#FBF9FD] px-3 py-2 text-xs font-semibold text-[#5E516B]">
                <Eye className="h-3.5 w-3.5" />
                {viewCount}
              </span>

              <Tooltip content={copied ? 'Link copied' : 'Copy link'}>
                <button
                  onClick={handleShare}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2F1D3B]/10 bg-white transition ${
                    copied ? 'text-emerald-600' : 'text-[#6B5C79] hover:bg-[#F8F6FB]'
                  }`}
                  aria-label={copied ? 'Link copied' : 'Copy link'}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                </button>
              </Tooltip>

              <Tooltip content={saved ? 'Remove bookmark' : 'Save discussion'}>
                <button
                  onClick={handleBookmark}
                  disabled={!isLoggedIn || savePending}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#2F1D3B]/10 bg-white text-[#6B5C79] transition hover:bg-[#F8F6FB] disabled:opacity-40"
                  aria-label={saved ? 'Remove bookmark' : 'Save discussion'}
                >
                  {saved ? <BookmarkCheck className="h-4 w-4 text-[#4C2F5E]" /> : <Bookmark className="h-4 w-4" />}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
