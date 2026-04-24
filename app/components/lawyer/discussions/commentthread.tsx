'use client';

import ProfileHoverLink from '@/app/components/lawyer/discussions/profile-hover-link';
import { ChevronDown, ChevronUp, CornerDownRight, Loader2, Send } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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
  id: string; body: string; createdAt: string;
  author: Author; replies?: Comment[];
}
interface Props {
  comments:      Comment[];
  discussionId?: string;
  answerId?:     string;
  currentUser?: Author | null;
}

function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function ini(n: string | null) {
  return n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
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

function CommentItem({ comment, discussionId, answerId, currentUser, depth = 0 }: {
  comment: Comment; discussionId?: string; answerId?: string;
  currentUser?: Author | null; depth?: number;
}) {
  const [showReply,    setShowReply]    = useState(false);
  const [showReplies,  setShowReplies]  = useState(true);
  const [replyText,    setReplyText]    = useState('');
  const [posting,      setPosting]      = useState(false);
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies ?? []);
  const isVerified = comment.author.lawyerProfile?.verificationStatus === 'VERIFIED';
  const currentViewer = normalizeCurrentUser(currentUser);
  const authorProfileHref = `/profile/user/${comment.author.id}`;

  async function submitReply() {
    if (!replyText.trim() || posting || !currentViewer?.id) return;
    setPosting(true);
    try {
      const endpoint = discussionId
        ? `/api/discussions/${discussionId}/comments`
        : `/api/answers/${answerId}/comments`;
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText, parentId: comment.id }),
      });
      if (res.ok) {
        const c = await res.json();
        setLocalReplies(p => [...p, {
          ...c,
          author: (c.author ?? currentViewer),
          replies: [],
        }]);
        setReplyText(''); setShowReply(false); setShowReplies(true);
      }
    } finally { setPosting(false); }
  }

  return (
    <div className={depth > 0 ? 'ml-5 pl-4 border-l-2 border-gray-100' : ''}>
      <div className="flex items-start gap-2.5 py-2">
        <div className="flex-1 min-w-0">
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
            {comment.author.avatarUrl
              ? <img src={comment.author.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-100 shrink-0 mt-0.5" />
              : <div className="w-6 h-6 bg-[#9F63C4]/80 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5">{ini(comment.author.displayName)}</div>
            }
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="truncate text-xs font-semibold text-gray-800">{comment.author.displayName ?? 'Anonymous'}</span>
                {isVerified && (
                  <Image src="/icons/circletick.png" alt="v" width={11} height={11}
                    style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
                )}
                <span className="text-[10px] text-gray-400">{ago(comment.createdAt)}</span>
              </div>
            </div>
          </ProfileHoverLink>
          <p className="text-xs text-[#374151] leading-relaxed">{comment.body}</p>
          {currentViewer?.id && depth < 2 && (
            <button onClick={() => setShowReply(!showReply)}
              className="mt-1 text-[11px] text-gray-400 hover:text-[#9F63C4] flex items-center gap-1 transition cursor-pointer">
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          )}
        </div>
      </div>

      {showReply && currentViewer?.id && (
        <div className="ml-8 mb-2 flex items-start gap-2">
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
            placeholder="Write a reply..." rows={2}
            className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-300 outline-none resize-none" />
          <button onClick={submitReply} disabled={posting || !replyText.trim()}
            className="p-2 bg-[#9F63C4] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {localReplies.length > 0 && (
        <div>
          <button onClick={() => setShowReplies(!showReplies)}
            className="ml-8 text-[11px] text-[#9F63C4] flex items-center gap-1 mb-1 cursor-pointer hover:opacity-70">
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {localReplies.length} {localReplies.length === 1 ? 'reply' : 'replies'}
          </button>
          {showReplies && localReplies.map(r => (
            <CommentItem key={r.id} comment={r} discussionId={discussionId} answerId={answerId}
              currentUser={currentViewer} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ comments, discussionId, answerId, currentUser }: Props) {
  const [local,    setLocal]    = useState<Comment[]>(comments);
  const [newBody,  setNewBody]  = useState('');
  const [posting,  setPosting]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const currentViewer = normalizeCurrentUser(currentUser);

  async function submit() {
    if (!newBody.trim() || posting || !currentViewer?.id) return;
    setPosting(true);
    try {
      const endpoint = discussionId
        ? `/api/discussions/${discussionId}/comments`
        : `/api/answers/${answerId}/comments`;
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newBody }),
      });
      if (res.ok) {
        const c = await res.json();
        setLocal(p => [...p, {
          ...c,
          author: (c.author ?? currentViewer),
          replies: [],
        }]);
        setNewBody(''); setShowForm(false);
      }
    } finally { setPosting(false); }
  }

  return (
    <div className="space-y-0.5">
      {local.map(c => (
        <CommentItem key={c.id} comment={c} discussionId={discussionId}
          answerId={answerId} currentUser={currentViewer} />
      ))}

      {currentViewer?.id && (
        <div className="mt-3">
          {!showForm ? (
            <button onClick={() => setShowForm(true)}
              className="text-xs text-[#9F63C4] hover:opacity-70 cursor-pointer font-medium">
              + Add a comment
            </button>
          ) : (
            <div className="flex items-start gap-2">
              <textarea value={newBody} onChange={e => setNewBody(e.target.value)}
                placeholder="Add a comment..." rows={2} autoFocus
                className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-300 outline-none resize-none" />
              <div className="flex flex-col gap-1">
                <button onClick={submit} disabled={posting || !newBody.trim()}
                  className="p-2 bg-[#9F63C4] text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 cursor-pointer">
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer">✕</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
