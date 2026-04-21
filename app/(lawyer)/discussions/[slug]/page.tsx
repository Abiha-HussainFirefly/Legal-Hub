'use client';

import AISummaryModal from '@/app/components/lawyer/discussions/ai-summary-modal';
import AnswerCard from '@/app/components/lawyer/discussions/answercard';
import CommentThread from '@/app/components/lawyer/discussions/commentthread';
import LawyerTopbar from '@/app/components/lawyer/lawyer-topbar';
import {
  ArrowLeft,
  ArrowUp,
  Eye,
  Loader2,
  MapPin,
  MessageSquare,
  Smile,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ini(n: string | null) {
  return n ? n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
}

function getKindLabel(kind: string) {
  return kind.toLowerCase().replace(/_/g, ' ');
}

const EMOJI_REACTIONS = [
  { emoji: '\u{1F44D}', type: 'LIKE', label: 'Like' },
  { emoji: '\u{1F44E}', type: 'DOWNVOTE', label: 'Downvote' },
  { emoji: '\u{1F60A}', type: 'HAPPY', label: 'Happy' },
  { emoji: '\u{1F680}', type: 'INSIGHTFUL', label: 'Insightful' },
  { emoji: '\u{1F615}', type: 'UNHAPPY', label: 'Unhappy' },
  { emoji: '\u{2764}\u{FE0F}', type: 'LOVE', label: 'Love' },
  { emoji: '\u{1F3AF}', type: 'INSIGHTFUL', label: 'On point' },
  { emoji: '\u{1F440}', type: 'HELPFUL', label: 'Watching' },
];

interface Author {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profile: { username: string | null; isLawyer: boolean } | null;
  lawyerProfile: { verificationStatus: string; barCouncil: string | null; firmName: string | null } | null;
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
  viewerReaction: string | null;
  viewerFollowing: boolean;
  viewerSaved: boolean;
  comments?: DiscussionComment[];
  aiSummaries?: {
    summaryText: string | null;
    mainIssue: string | null;
    keyPoints: unknown;
    expertConsensus: string | null;
    status: string;
  }[];
}

interface DiscussionComment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  replies?: DiscussionComment[];
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

interface EmojiStat {
  count: number;
  reactors: string[];
  isMyReaction: boolean;
}

export default function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);

  const [user, setUser] = useState<{ id?: string; name?: string; displayName?: string; email?: string } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [disc, setDisc] = useState<Discussion | null>(null);
  const [loading, setLoading] = useState(true);

  const [score, setScore] = useState(0);
  const [myReac, setMyReac] = useState<string | null>(null);
  const [reactPend, setReactP] = useState(false);

  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiStats, setEmojiStats] = useState<Record<string, EmojiStat>>({});
  const emojiRef = useRef<HTMLDivElement>(null);

  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [localAnswers, setLocalAnswers] = useState<AnswerRow[]>([]);
  const [discussionComments, setDiscussionComments] = useState<DiscussionComment[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/discussions/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.replace('/discussions');
          return;
        }
        const d: Discussion = data.discussion ?? data;
        setDisc(d);
        setScore(d.score ?? 0);
        setMyReac(d.viewerReaction || null);
        setDiscussionComments(d.comments ?? []);
      })
      .catch(() => router.replace('/discussions'))
      .finally(() => setLoading(false));
  }, [router, slug]);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/discussions/${slug}/answers?limit=50&sort=top`)
      .then((r) => r.json())
      .then((data) => setLocalAnswers(data.data ?? []))
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!disc?.id) return;
    fetch(`/api/discussions/${disc.id}/reactions`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setEmojiStats(data.data);
      })
      .catch(() => {});
  }, [disc?.id]);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    }
    if (showEmoji) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showEmoji]);

  async function react(type: string) {
    if (!user || !disc || reactPend) return;
    setReactP(true);
    const prev = myReac;
    const wasMe = myReac === type;
    const delta =
      type === 'UPVOTE'
        ? (wasMe ? -1 : myReac === 'DOWNVOTE' ? 2 : 1)
        : type === 'DOWNVOTE'
          ? (wasMe ? 1 : myReac === 'UPVOTE' ? -2 : -1)
          : 0;

    setScore((s) => s + delta);
    setMyReac(wasMe ? null : type);
    try {
      const res = await fetch(`/api/discussions/${disc.slug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setScore((s) => s - delta);
      setMyReac(prev);
    } finally {
      setReactP(false);
    }
  }

  async function reactEmoji(type: string, emoji: string) {
    if (!user || !disc || reactPend) return;
    setReactP(true);
    const userName = user.displayName || user.name || 'You';

    setEmojiStats((prev) => {
      const existing = prev[emoji] ?? { count: 0, reactors: [], isMyReaction: false };
      if (existing.isMyReaction) {
        const newReactors = existing.reactors.filter((r) => r !== userName);
        const updated = { ...prev };
        if (newReactors.length === 0) delete updated[emoji];
        else updated[emoji] = { count: newReactors.length, reactors: newReactors, isMyReaction: false };
        return updated;
      }

      return {
        ...prev,
        [emoji]: {
          count: existing.count + 1,
          reactors: [...existing.reactors, userName],
          isMyReaction: true,
        },
      };
    });
    setShowEmoji(false);

    try {
      await fetch(`/api/discussions/${disc.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type, emoji }),
      });
      const fresh = await fetch(`/api/discussions/${disc.id}/emoji-reactions`).then((r) => r.json());
      if (fresh.data) setEmojiStats(fresh.data);
    } catch {
      // Optimistic recovery handled by context or fresh fetch
    } finally {
      setReactP(false);
    }
  }

  async function postAnswer() {
    if (!answerText.trim() || posting || !user || !disc) return;
    setPosting(true);
    setPostError('');
    try {
      const res = await fetch(`/api/discussions/${disc.slug}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: answerText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post answer');
      setLocalAnswers((prev) => [
        ...prev,
        { ...data.answer, isAccepted: false, viewerReaction: null, comments: [] },
      ]);
      setAnswerText('');
    } catch (e: unknown) {
      setPostError(e instanceof Error ? e.message : 'Failed to post answer');
    } finally {
      setPosting(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/lawyerlogin');
  }

  if (loading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E3DBE9] border-t-[#4C2F5E]" />
      </div>
    );
  }

  if (!disc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F8F6FB]">
        <p className="text-[#736683]">Discussion not found.</p>
        <Link href="/discussions" className="text-sm font-semibold text-[#4C2F5E]">
          Back to discussions
        </Link>
      </div>
    );
  }

  const aiSummary = disc.aiSummaries?.[0] ?? null;
  const isVerified = disc.author.lawyerProfile?.verificationStatus === 'VERIFIED';
  const isResolved = disc.status === 'RESOLVED';
  const activeEmojis = Object.entries(emojiStats);

  const allParticipants = Array.from(
    new Map([
      [disc.author.id, disc.author],
      ...localAnswers.map((a) => [a.author.id, a.author] as [string, Author]),
    ]).values(),
  );

  return (
    <div className="min-h-screen bg-[#F8F6FB]">
      <LawyerTopbar
        activeTab="discussions"
        user={user}
        onLogout={handleLogout}
      />

      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6 lg:px-8">
        <Link href="/discussions" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#4C2F5E]">
          <ArrowLeft className="h-4 w-4" />
          Back to discussions
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <section className="legal-panel px-5 py-5 md:px-6 md:py-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#4C2F5E]/10 bg-[#F1EAF6] px-3 py-1 text-[11px] font-semibold text-[#4C2F5E]">
                  {disc.category.name}
                </span>
                {disc.region ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] text-[#6B5C79]">
                    <MapPin className="h-3 w-3" />
                    {disc.region.name}
                  </span>
                ) : null}
                {disc.isAiSummaryReady ? (
                  <span className="rounded-full bg-[#4C2F5E] px-3 py-1 text-[11px] font-semibold text-white">
                    AI Summary
                  </span>
                ) : null}
                {isResolved ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    Answered
                  </span>
                ) : (
                  <span className="rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] font-semibold capitalize text-[#6B5C79]">
                    {getKindLabel(disc.kind)}
                  </span>
                )}
                {disc.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full border border-[#4C2F5E]/10 bg-white px-2.5 py-1 text-[11px] font-medium text-[#6B5C79]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold leading-9 tracking-[-0.03em] text-[#2F1D3B] md:text-[30px]">
                    {disc.title}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {disc.author.avatarUrl ? (
                      <img src={disc.author.avatarUrl} alt="" className="h-10 w-10 rounded-full border border-[#4C2F5E]/10 object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C2F5E] text-sm font-semibold text-white">
                        {ini(disc.author.displayName)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#4C2F5E]">
                          {disc.author.displayName ?? 'Anonymous'}
                        </span>
                        {isVerified ? (
                          <span className="rounded-full bg-[#F1EAF6] px-2 py-0.5 text-[10px] font-semibold text-[#4C2F5E]">
                            Verified
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[12px] text-[#8B7D99]">Posted {ago(disc.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {disc.isAiSummaryReady ? (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="rounded-[14px] border border-[#4C2F5E] bg-[#4C2F5E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#432853]"
                    >
                      AI Summary
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 border-t border-[#4C2F5E]/8 pt-6">
                <div className="whitespace-pre-wrap text-sm leading-7 text-[#5F506D]">
                  {disc.body}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#4C2F5E]/8 pt-4">
                <button
                  onClick={() => react('UPVOTE')}
                  disabled={!user || reactPend}
                  className={`reaction-pill ${
                    myReac === 'UPVOTE'
                      ? 'border-[#4C2F5E]/20 bg-[#F1EAF6] text-[#4C2F5E]'
                      : ''
                  }`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  {score}
                </button>

                <div className="relative" ref={emojiRef}>
                  <button
                    onClick={() => user && setShowEmoji((v) => !v)}
                    disabled={!user}
                    className="reaction-pill px-2.5 disabled:opacity-40"
                  >
                    <Smile className="h-3.5 w-3.5" />
                  </button>

                  {showEmoji ? (
                    <div className="absolute bottom-10 left-0 z-50 flex min-w-max items-center gap-1 rounded-2xl border border-[#4C2F5E]/10 bg-white px-3 py-2">
                      {EMOJI_REACTIONS.map((r) => (
                        <button
                          key={r.emoji}
                          onClick={() => reactEmoji(r.type, r.emoji)}
                          title={r.label}
                          className={`rounded-xl p-1.5 text-[18px] transition-transform hover:scale-110 ${
                            emojiStats[r.emoji]?.isMyReaction ? 'bg-[#F1EAF6]' : 'hover:bg-[#F7F3FA]'
                          }`}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {activeEmojis.map(([emoji, stat]) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      const found = EMOJI_REACTIONS.find((r) => r.emoji === emoji);
                      if (found) reactEmoji(found.type, emoji);
                    }}
                    className={`reaction-pill ${
                      stat.isMyReaction ? 'border-[#4C2F5E]/20 bg-[#F1EAF6] text-[#4C2F5E]' : ''
                    }`}
                  >
                    <span className="text-[14px] leading-none">{emoji}</span>
                    {stat.count}
                  </button>
                ))}

                <span className="reaction-pill text-[#6B5C79]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {disc.answerCount} answer{disc.answerCount !== 1 ? 's' : ''}
                </span>

                <span className="inline-flex items-center gap-1.5 text-sm text-[#8B7D99]">
                  <Eye className="h-4 w-4" />
                  {disc.viewCount}
                </span>
              </div>

              {disc.commentCount > 0 || user ? (
                <div className="mt-6 border-t border-[#4C2F5E]/8 pt-5">
                  <CommentThread comments={discussionComments} discussionId={disc.slug} currentUserId={user?.id} />
                </div>
              ) : null}
            </section>

            <div id="answers" className="mt-8 flex items-center gap-2 text-[#4C2F5E]">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                {localAnswers.length} Answer{localAnswers.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {localAnswers.length === 0 ? (
              <div className="mt-4 rounded-[20px] border border-[#4C2F5E]/10 bg-white px-6 py-10 text-center text-sm text-[#736683]">
                No answers yet. Be the first to help.
              </div>
            ) : null}

            <div className="mt-4 space-y-4">
              {localAnswers.map((ans) => (
                <AnswerCard
                  key={ans.id}
                  id={ans.id}
                  body={ans.body}
                  status={ans.status}
                  isAccepted={ans.isAccepted || ans.id === disc.acceptedAnswerId}
                  isExpertAnswer={ans.isExpertAnswer}
                  score={ans.score}
                  reactionCount={ans.reactionCount}
                  commentCount={ans.commentCount}
                  acceptedAt={ans.acceptedAt}
                  createdAt={ans.createdAt}
                  author={ans.author}
                  comments={ans.comments ?? []}
                  userReaction={ans.viewerReaction ?? null}
                  discussionAuthorId={disc.author.id}
                  currentUserId={user?.id}
                  discussionId={disc.id}
                  isDiscussionResolved={disc.status === 'RESOLVED'}
                />
              ))}
            </div>

            <section className="mt-6 rounded-[24px] border border-[#4C2F5E]/10 bg-white px-5 py-5 md:px-6 md:py-6">
              <h3 className="text-lg font-semibold text-[#2F1D3B]">Your answer</h3>
              {!user ? (
                <div className="py-6">
                  <p className="text-sm text-[#736683]">You must be signed in to answer.</p>
                  <Link
                    href="/lawyerlogin"
                    className="mt-4 inline-flex rounded-[14px] border border-[#4C2F5E] bg-[#4C2F5E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#432853]"
                  >
                    Sign in to answer
                  </Link>
                </div>
              ) : disc.status === 'LOCKED' ? (
                <p className="mt-4 text-sm text-[#736683]">
                  This discussion is locked and no longer accepts answers.
                </p>
              ) : (
                <>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Share your legal expertise or experience..."
                    className="legal-field mt-4 h-40 resize-none p-4"
                  />
                  {postError ? (
                    <p className="mt-3 rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {postError}
                    </p>
                  ) : null}
                  <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-[#736683]">
                      Keep the answer accurate, practical, and easy to verify.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAnswerText('')}
                        className="rounded-[14px] border border-[#4C2F5E]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#6B5C79] transition hover:bg-[#F7F3FA]"
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

          <aside className="space-y-4">
            <div className="legal-soft-panel p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Thread overview</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Status</p>
                  <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                    isResolved
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-[#4C2F5E]/10 bg-[#F7F3FA] text-[#4C2F5E]'
                  }`}>
                    {isResolved ? 'Answered' : getKindLabel(disc.kind)}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Category</p>
                  <p className="mt-2 text-sm font-semibold text-[#4C2F5E]">{disc.category.name}</p>
                </div>

                {disc.region ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Region</p>
                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-[#5F506D]">
                      <MapPin className="h-4 w-4 text-[#4C2F5E]" />
                      {disc.region.name}
                    </div>
                  </div>
                ) : null}

                <div className="border-t border-[#4C2F5E]/8 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Stats</p>
                  <div className="mt-3 space-y-3">
                    {[
                      ['Views', disc.viewCount],
                      ['Answers', disc.answerCount],
                      ['Score', score],
                      ['Followers', disc.followerCount],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-[#736683]">{label}</span>
                        <span className="font-semibold text-[#4C2F5E]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {allParticipants.length > 0 ? (
              <div className="legal-soft-panel p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Participants</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {allParticipants.slice(0, 20).map((author) => (
                    <div key={author.id} title={author.displayName ?? 'Participant'}>
                      {author.avatarUrl ? (
                        <img src={author.avatarUrl} alt="" className="h-9 w-9 rounded-full border border-[#4C2F5E]/10 object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4C2F5E] text-[10px] font-semibold text-white">
                          {ini(author.displayName)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {allParticipants.length > 20 ? (
                  <p className="mt-3 text-xs text-[#8B7D99]">and {allParticipants.length - 20} others</p>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <AISummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summaryData={aiSummary}
        discussionTitle={disc.title}
      />
    </div>
  );
}