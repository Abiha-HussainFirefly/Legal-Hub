'use client';

import Tooltip from '@/app/components/ui/tooltip';
import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import { apiRequest } from '@/lib/api-client';
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, ChevronUp, Loader2, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import CommentThread from './commentthread';

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

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  replies?: Comment[];
}

interface Props {
  id: string;
  body: string;
  status: string;
  isAccepted: boolean;
  isExpertAnswer: boolean;
  score: number;
  reactionCount: number;
  commentCount: number;
  acceptedAt: string | null;
  createdAt: string;
  author: Author;
  comments: Comment[];
  userReaction?: string | null;
  discussionAuthorId: string;
  currentUserId?: string;
  currentUser?: Author | null;
  discussionId: string;
  isDiscussionResolved: boolean;
}

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ini(n: string | null) {
  return n ? n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
}

export default function AnswerCard({
  id,
  body,
  isAccepted,
  isExpertAnswer,
  score,
  commentCount,
  createdAt,
  author,
  comments,
  userReaction,
  discussionAuthorId,
  currentUserId,
  currentUser,
  isDiscussionResolved,
}: Props) {
  const [curScore, setScore] = useState(score);
  const [myReac, setMyReac] = useState<string | null>(userReaction ?? null);
  const [accepted, setAccepted] = useState(isAccepted);
  const [showComments, setShowCom] = useState(false);
  const [reactPend, setReactP] = useState(false);
  const [acceptPend, setAcceptP] = useState(false);
  const [actionPulse, setActionPulse] = useState<'vote' | 'accept' | null>(null);

  const isAuthor = currentUserId === discussionAuthorId;
  const isVerified = author.lawyerProfile?.verificationStatus === 'VERIFIED';
  const authorProfileHref = `/profile/user/${author.id}`;

  useEffect(() => {
    if (!actionPulse) return;
    const timeout = window.setTimeout(() => setActionPulse(null), 320);
    return () => window.clearTimeout(timeout);
  }, [actionPulse]);

  async function react(type: string) {
    if (!currentUserId || reactPend) return;
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
      await apiRequest(`/api/answers/${id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type }),
      });
      setActionPulse('vote');
    } catch {
      setScore((s) => s - delta);
      setMyReac(prev);
    } finally {
      setReactP(false);
    }
  }

  async function accept() {
    if (!isAuthor || acceptPend || accepted) return;
    setAcceptP(true);
    try {
      await apiRequest(`/api/answers/${id}/accept`, { method: 'POST' });
      setAccepted(true);
      setActionPulse('accept');
    } finally {
      setAcceptP(false);
    }
  }

  return (
    <div className={`answer-card overflow-hidden ${accepted ? 'border-[#4C2F5E]/20 bg-[#FCFAFD]' : ''} lh-page-enter`}>
      <div className="px-5 py-5 md:px-6 md:py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {accepted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4C2F5E]/10 bg-[#F1EAF6] px-3 py-1 text-[11px] font-semibold text-[#4C2F5E]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Best Answer
            </span>
          ) : null}
          {isExpertAnswer && !accepted ? (
            <span className="rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-[11px] font-semibold text-[#4C2F5E]">
              Expert Answer
            </span>
          ) : null}
        </div>

        <div className="flex gap-4">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <Tooltip content="Upvote answer">
              <button
                onClick={() => react('UPVOTE')}
                disabled={!currentUserId || reactPend}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-40 ${
                  myReac === 'UPVOTE'
                    ? 'border-[#4C2F5E]/20 bg-[#F1EAF6] text-[#4C2F5E]'
                    : 'border-[#4C2F5E]/10 text-[#6B5C79] hover:bg-[#F7F3FA]'
                } ${actionPulse === 'vote' ? 'lh-action-bump' : ''}`}
                aria-label="Upvote answer"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </Tooltip>
            <span className={`text-sm font-semibold ${curScore > 0 ? 'text-[#4C2F5E]' : curScore < 0 ? 'text-red-500' : 'text-[#6B5C79]'}`}>
              {curScore}
            </span>
            <Tooltip content="Downvote answer">
              <button
                onClick={() => react('DOWNVOTE')}
                disabled={!currentUserId || reactPend}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-40 ${
                  myReac === 'DOWNVOTE'
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-[#4C2F5E]/10 text-[#6B5C79] hover:bg-[#F7F3FA]'
                } ${actionPulse === 'vote' ? 'lh-action-bump' : ''}`}
                aria-label="Downvote answer"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-start gap-3">
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
                region={author.profile?.primaryRegion?.name ?? null}
                className="flex min-w-0 flex-1 items-start gap-3"
                panelPosition="top"
              >
                {author.avatarUrl ? (
                  <img
                    src={author.avatarUrl}
                    alt={author.displayName ?? 'Answer author'}
                    className="h-10 w-10 rounded-full border border-[#4C2F5E]/10 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C2F5E] text-xs font-semibold text-white">
                    {ini(author.displayName)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#2F1D3B]">
                      {author.displayName ?? 'Anonymous'}
                    </span>
                    {isVerified ? (
                      <span className="rounded-full bg-[#F1EAF6] px-2 py-0.5 text-[10px] font-semibold text-[#4C2F5E]">
                        Verified Lawyer
                      </span>
                    ) : null}
                    {author.lawyerProfile?.barCouncil ? (
                      <span className="rounded-full border border-[#4C2F5E]/10 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#7B6D8A]">
                        {author.lawyerProfile.barCouncil}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[12px] text-[#8B7D99]">{ago(createdAt)}</p>
                </div>
              </ProfileHoverLink>
            </div>

            <div className="whitespace-pre-wrap text-sm leading-7 text-[#5F506D]">
              {body}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#4C2F5E]/8 pt-4">
              <button
                onClick={() => setShowCom(!showComments)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6B5C79] transition hover:text-[#4C2F5E]"
              >
                <MessageSquare className="h-4 w-4" />
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
                {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isAuthor && !accepted && !isDiscussionResolved ? (
                <button
                  onClick={accept}
                  disabled={acceptPend}
                  className={`inline-flex items-center gap-2 rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 ${
                    actionPulse === 'accept' ? 'lh-action-bump lh-action-flash' : ''
                  }`}
                >
                  {acceptPend ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Accept Answer
                </button>
              ) : null}
            </div>

            {showComments ? (
              <div className="mt-4 border-t border-[#4C2F5E]/8 pt-4 lh-form-enter">
                <CommentThread comments={comments} answerId={id} currentUser={currentUser} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
