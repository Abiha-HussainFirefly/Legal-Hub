'use client';

import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import { ArrowUp, Bookmark, BookmarkCheck, Eye, MapPin, MessageSquare, Smile, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

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

const EMOJI_REACTIONS = [
  { emoji: '\u{1F44D}', type: 'LIKE', label: 'Like' },
  { emoji: '\u{1F44E}', type: 'DOWNVOTE', label: 'Downvote' },
  { emoji: '\u{1F60A}', type: 'HAPPY', label: 'Happy' },
  { emoji: '\u{1F680}', type: 'INSIGHTFUL', label: 'Insightful' },
  { emoji: '\u{1F615}', type: 'UNHAPPY', label: 'Confused' },
  { emoji: '\u{2764}\u{FE0F}', type: 'LOVE', label: 'Love' },
  { emoji: '\u{1F3AF}', type: 'INSIGHTFUL', label: 'On point' },
  { emoji: '\u{1F440}', type: 'HELPFUL', label: 'Watching' },
];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function ini(n: string | null) {
  if (!n) return '?';
  return n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function DiscussionCard({
  slug,
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
  userReaction: initReaction = null,
  isSaved: initSaved = false,
  isLoggedIn,
  initialEmojiStats = {},
}: Props) {
  const [saved, setSaved] = useState(initSaved);
  const [savePend, setSavePend] = useState(false);
  const [myReac, setMyReac] = useState<string | null>(initReaction?.reactionType ?? null);
  const [myEmoji, setMyEmoji] = useState<string | null>(initReaction?.emoji ?? null);
  const [reactPend, setReactPend] = useState(false);
  const [curScore, setCurScore] = useState(score);
  const [showEmoji, setShowEmoji] = useState(false);
  const [copied,     setCopied]    = useState(false);
  const [emojiStats, setEmojiStats] = useState<Record<string, { count: number; reactors: string[] }>>(initialEmojiStats);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    if (showEmoji) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showEmoji]);

  useEffect(() => {
    setSaved(initSaved);
  }, [initSaved]);

  useEffect(() => {
    setMyReac(initReaction?.reactionType ?? null);
    setMyEmoji(initReaction?.emoji ?? null);
  }, [initReaction]);

  useEffect(() => {
    setCurScore(score);
  }, [score]);

  useEffect(() => {
    setEmojiStats(initialEmojiStats);
  }, [initialEmojiStats]);

  const handleUpvote = useCallback(async () => {
    if (!isLoggedIn || reactPend) return;
    setReactPend(true);

    try {
      const res = await fetch(`/api/discussions/${slug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: 'UPVOTE' }),
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      setCurScore(data.score ?? score);
      setMyReac(data.viewerReaction?.reactionType ?? null);
      setMyEmoji(data.viewerReaction?.emoji ?? null);
      setEmojiStats(data.emojiStats ?? {});
    } catch {
      // Keep existing state if the backend update fails.
    } finally {
      setReactPend(false);
    }
  }, [isLoggedIn, reactPend, score, slug]);

  const reactEmoji = useCallback(async (type: string, emoji: string) => {
    if (!isLoggedIn || reactPend) return;
    setReactPend(true);

    try {
      const res = await fetch(`/api/discussions/${slug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type, emoji }),
      });
      if (!res.ok) throw new Error();

      const data = await res.json();
      setCurScore(data.score ?? score);
      setMyReac(data.viewerReaction?.reactionType ?? null);
      setMyEmoji(data.viewerReaction?.emoji ?? null);
      setEmojiStats(data.emojiStats ?? {});
      setShowEmoji(false);
    } catch {
      // Keep existing state if the backend update fails.
    } finally {
      setReactPend(false);
    }
  }, [isLoggedIn, reactPend, score, slug]);

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn || savePend) return;
    setSavePend(true);
    setSaved((s) => !s);
    try {
      const res = await fetch(`/api/discussions/${slug}/bookmark`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      setSaved((s) => !s);
    } finally {
      setSavePend(false);
    }
  }, [isLoggedIn, savePend, slug]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/discussions/${slug}`;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [slug]);

  const isResolved = status === 'RESOLVED';
  const isVerified = author.lawyerProfile?.verificationStatus === 'VERIFIED';
  const activeEmojis = Object.entries(emojiStats);
  const authorProfileHref = `/profile/user/${author.id}`;

  return (
    <article className="discussion-card">
      <div
        className="h-[3px] w-full"
        style={{ background: category.colorHex || '#4C2F5E' }}
      />

      <div className="px-5 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#4C2F5E]/10 bg-[#F7F3FA] px-3 py-1 text-[11px] font-semibold text-[#4C2F5E]">
            {category.name}
          </span>
          {region ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] text-[#6B5C79]">
              <MapPin className="h-3 w-3" />
              {region.name}
            </span>
          ) : null}
          {isAiSummaryReady ? (
            <Link
              href={`/discussions/${slug}`}
              className="rounded-full bg-[#4C2F5E] px-3 py-1 text-[11px] font-semibold text-white"
            >
              AI Summary
            </Link>
          ) : null}
          {isResolved ? (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              Answered
            </span>
          ) : null}
          {isPinned ? (
            <span className="rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] font-semibold text-[#6B5C79]">
              Pinned
            </span>
          ) : null}
        </div>

        <Link href={`/discussions/${slug}`} className="block">
          <h3 className="text-[17px] font-semibold leading-7 text-[#2F1D3B] transition-colors hover:text-[#4C2F5E]">
            {title}
          </h3>
        </Link>

        {excerpt ? (
          <p className="mt-2 text-sm leading-6 text-[#736683] line-clamp-2">
            {excerpt}
          </p>
        ) : null}

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t.tag.id}
                className="rounded-full border border-[#4C2F5E]/10 bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B5C79]"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#4C2F5E]/8 pt-4">
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
                className="h-8 w-8 rounded-full border border-[#4C2F5E]/10 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4C2F5E] text-[11px] font-semibold text-white">
                {ini(author.displayName)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-[#4C2F5E]">
                  {author.displayName ?? 'Anonymous'}
                </span>
                {isVerified ? (
                  <span className="rounded-full bg-[#F1EAF6] px-2 py-0.5 text-[10px] font-semibold text-[#4C2F5E]">
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="text-[12px] text-[#8B7D99]">{timeAgo(createdAt)}</p>
            </div>
          </ProfileHoverLink>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleUpvote();
              }}
              disabled={!isLoggedIn || reactPend}
              className={`reaction-pill ${
                myReac === 'UPVOTE' && !myEmoji
                  ? 'border-[#4C2F5E]/20 bg-[#F7F3FA] text-[#4C2F5E]'
                  : ''
              }`}
              title={myReac === 'UPVOTE' ? 'Remove upvote' : 'Upvote'}
            >
              <ArrowUp className="h-3.5 w-3.5" />
              {curScore}
            </button>

            <div className="relative" ref={emojiRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (isLoggedIn) setShowEmoji((v) => !v);
                }}
                disabled={!isLoggedIn}
                className="reaction-pill px-2.5"
                title="React with emoji"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>

              {showEmoji ? (
                <div className="absolute bottom-10 left-0 z-50 flex min-w-max items-center gap-1 rounded-2xl border border-[#4C2F5E]/10 bg-white px-3 py-2">
                  {EMOJI_REACTIONS.map((r) => {
                    const isMine = myEmoji === r.emoji;
                    return (
                      <button
                        key={r.emoji}
                        onClick={() => reactEmoji(r.type, r.emoji)}
                        title={r.label}
                        className={`rounded-xl p-1.5 text-[18px] transition-transform hover:scale-110 ${
                          isMine ? 'bg-[#F7F3FA]' : 'hover:bg-[#F7F3FA]'
                        }`}
                      >
                        {r.emoji}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {activeEmojis.map(([emoji, stat]) => {
              const isMine = myEmoji === emoji;
              return (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.preventDefault();
                    const found = EMOJI_REACTIONS.find((r) => r.emoji === emoji);
                    if (found) reactEmoji(found.type, emoji);
                  }}
                  className={`reaction-pill ${
                    isMine ? 'border-[#4C2F5E]/20 bg-[#F7F3FA] text-[#4C2F5E]' : ''
                  }`}
                >
                  <span className="text-[14px] leading-none">{emoji}</span>
                  {stat.count}
                </button>
              );
            })}

            <Link
              href={`/discussions/${slug}#answers`}
              className="reaction-pill text-[#6B5C79] hover:text-[#4C2F5E]"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {answerCount}
            </Link>

            <span className="inline-flex items-center gap-1.5 text-[12px] text-[#8B7D99]">
              <Eye className="h-3.5 w-3.5" />
              {viewCount}
            </span>

            {/* Share */}
          <button onClick={handleShare} title="Copy link"
            className={`flex items-center gap-1 p-1.5 rounded-lg transition cursor-pointer flex-shrink-0 ${
              copied ? 'text-emerald-500' : 'text-[#B0A4BC] hover:text-[#4C2F5E]'
            }`}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

            <button
              onClick={handleBookmark}
              disabled={!isLoggedIn || savePend}
              title={saved ? 'Remove bookmark' : 'Bookmark'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#4C2F5E]/10 text-[#6B5C79] transition hover:bg-[#F7F3FA] disabled:opacity-40"
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4 text-[#4C2F5E]" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
