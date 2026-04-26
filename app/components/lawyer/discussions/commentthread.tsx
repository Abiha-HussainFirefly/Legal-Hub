'use client';

import Tooltip from '@/app/components/ui/tooltip';
import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import { apiRequest } from '@/lib/api-client';
import { ChevronDown, ChevronUp, CornerDownRight, Loader2, Send } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Author {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profile?: {
    username?: string | null;
    isLawyer?: boolean;
    headline?: string | null;
    primaryRegion?: { name: string } | null;
  } | null;
  lawyerProfile: {
    verificationStatus: string;
    barCouncil?: string | null;
    firmName?: string | null;
  } | null;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  replies?: Comment[];
}

interface Props {
  comments: Comment[];
  discussionId?: string;
  answerId?: string;
  currentUser?: Author | null;
}

function ago(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function initials(name: string | null) {
  return name ? name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() : '?';
}

function normalizeCurrentUser(currentUser?: Author | null): Author | null {
  if (!currentUser) return null;
  return {
    id: currentUser.id,
    displayName: currentUser.displayName,
    avatarUrl: currentUser.avatarUrl,
    profile: currentUser.profile ?? null,
    lawyerProfile: currentUser.lawyerProfile ?? null,
  };
}

function CommentItem({
  comment,
  discussionId,
  answerId,
  currentUser,
  depth = 0,
}: {
  comment: Comment;
  discussionId?: string;
  answerId?: string;
  currentUser?: Author | null;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies ?? []);
  const [replyPulse, setReplyPulse] = useState(false);
  const isVerified = comment.author.lawyerProfile?.verificationStatus === 'VERIFIED';
  const currentViewer = normalizeCurrentUser(currentUser);
  const authorProfileHref = `/profile/user/${comment.author.id}`;

  useEffect(() => {
    if (!replyPulse) return;
    const timeout = window.setTimeout(() => setReplyPulse(false), 320);
    return () => window.clearTimeout(timeout);
  }, [replyPulse]);

  async function submitReply() {
    if (!replyText.trim() || posting || !currentViewer?.id) return;

    setPosting(true);

    try {
      const endpoint = discussionId
        ? `/api/discussions/${discussionId}/comments`
        : `/api/answers/${answerId}/comments`;

      const response = await apiRequest<Comment>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText, parentId: comment.id }),
      });

      setLocalReplies((current) => [
        ...current,
        {
          ...response,
          author: response.author ?? currentViewer,
          replies: [],
        },
      ]);
      setReplyText('');
      setShowReply(false);
      setShowReplies(true);
      setReplyPulse(true);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-5 border-l-2 border-gray-100 pl-4' : ''} ${replyPulse ? 'lh-page-enter' : ''}`}>
      <div className="flex items-start gap-2.5 py-2">
        <div className="min-w-0 flex-1">
          <ProfileHoverLink
            href={authorProfileHref}
            displayName={comment.author.displayName}
            username={comment.author.profile?.username}
            avatarUrl={comment.author.avatarUrl}
            isVerified={isVerified}
            isLawyer={comment.author.profile?.isLawyer ?? false}
            headline={comment.author.profile?.headline}
            firmName={comment.author.lawyerProfile?.firmName}
            barCouncil={comment.author.lawyerProfile?.barCouncil}
            region={comment.author.profile?.primaryRegion?.name ?? null}
            className="inline-flex min-w-0 items-start gap-2.5"
            panelPosition="top"
          >
            {comment.author.avatarUrl ? (
              <img src={comment.author.avatarUrl} alt="" className="mt-0.5 h-6 w-6 shrink-0 rounded-full border border-gray-100 object-cover" />
            ) : (
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9F63C4]/80 text-[8px] font-bold text-white">
                {initials(comment.author.displayName)}
              </div>
            )}

            <div className="min-w-0">
              <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-gray-800">{comment.author.displayName ?? 'Anonymous'}</span>
                {isVerified ? (
                  <Image
                    src="/icons/circletick.png"
                    alt="Verified"
                    width={11}
                    height={11}
                    style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }}
                    unoptimized
                  />
                ) : null}
                <span className="text-[10px] text-gray-400">{ago(comment.createdAt)}</span>
              </div>
            </div>
          </ProfileHoverLink>

          <p className="text-xs leading-relaxed text-[#374151]">{comment.body}</p>

          {currentViewer?.id && depth < 2 ? (
            <button
              onClick={() => setShowReply((current) => !current)}
              className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 transition hover:text-[#9F63C4]"
            >
              <CornerDownRight className="h-3 w-3" />
              Reply
            </button>
          ) : null}
        </div>
      </div>

      {showReply && currentViewer?.id ? (
        <div className="lh-form-enter mb-2 ml-8 flex items-start gap-2">
          <textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-300"
          />
          <Tooltip content={posting ? 'Posting reply' : 'Post reply'}>
            <button
              onClick={submitReply}
              disabled={posting || !replyText.trim()}
              className={`rounded-lg bg-[#9F63C4] p-2 text-white transition hover:opacity-90 disabled:opacity-50 ${posting ? 'lh-action-bump' : ''}`}
              aria-label={posting ? 'Posting reply' : 'Post reply'}
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </Tooltip>
        </div>
      ) : null}

      {localReplies.length > 0 ? (
        <div>
          <button
            onClick={() => setShowReplies((current) => !current)}
            className="mb-1 ml-8 flex items-center gap-1 text-[11px] text-[#9F63C4] hover:opacity-70"
          >
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {localReplies.length} {localReplies.length === 1 ? 'reply' : 'replies'}
          </button>

          {showReplies
            ? localReplies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  discussionId={discussionId}
                  answerId={answerId}
                  currentUser={currentViewer}
                  depth={depth + 1}
                />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CommentThread({ comments, discussionId, answerId, currentUser }: Props) {
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [newBody, setNewBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitPulse, setSubmitPulse] = useState(false);
  const currentViewer = normalizeCurrentUser(currentUser);

  useEffect(() => {
    if (!submitPulse) return;
    const timeout = window.setTimeout(() => setSubmitPulse(false), 320);
    return () => window.clearTimeout(timeout);
  }, [submitPulse]);

  async function submitComment() {
    if (!newBody.trim() || posting || !currentViewer?.id) return;

    setPosting(true);

    try {
      const endpoint = discussionId
        ? `/api/discussions/${discussionId}/comments`
        : `/api/answers/${answerId}/comments`;

      const response = await apiRequest<Comment>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newBody }),
      });

      setLocalComments((current) => [
        ...current,
        {
          ...response,
          author: response.author ?? currentViewer,
          replies: [],
        },
      ]);
      setNewBody('');
      setShowForm(false);
      setSubmitPulse(true);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className={`space-y-0.5 ${submitPulse ? 'lh-page-enter' : ''}`}>
      {localComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          discussionId={discussionId}
          answerId={answerId}
          currentUser={currentViewer}
        />
      ))}

      {currentViewer?.id ? (
        <div className="mt-3">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="text-xs font-medium text-[#9F63C4] hover:opacity-70">
              + Add a comment
            </button>
          ) : (
            <div className="lh-form-enter flex items-start gap-2">
              <textarea
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                placeholder="Add a comment..."
                rows={2}
                autoFocus
                className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-300"
              />
              <div className="flex flex-col gap-1">
                <Tooltip content={posting ? 'Posting comment' : 'Post comment'}>
                  <button
                    onClick={submitComment}
                    disabled={posting || !newBody.trim()}
                    className={`rounded-lg bg-[#9F63C4] p-2 text-white transition hover:opacity-90 disabled:opacity-50 ${posting ? 'lh-action-bump' : ''}`}
                    aria-label={posting ? 'Posting comment' : 'Post comment'}
                  >
                    {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  </button>
                </Tooltip>
                <Tooltip content="Cancel">
                  <button onClick={() => setShowForm(false)} className="p-2 text-xs text-gray-400 hover:text-gray-600" aria-label="Cancel">
                  ×
                </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
