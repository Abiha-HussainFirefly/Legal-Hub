import CaseUserLink from '@/app/components/cases/case-user-link';
import type { CaseCommentItem } from '@/types/case';
import { MessageSquareText, PencilLine, Reply, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'LH';
}

function CommentNode({ comment, depth = 0 }: { comment: CaseCommentItem; depth?: number }) {
  const [showReplies, setShowReplies] = useState(depth === 0);
  const moderationTone =
    comment.moderationState === 'FLAGGED'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : comment.moderationState === 'UNDER_REVIEW'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : null;

  return (
    <div className={`${depth > 0 ? 'border-l border-[#4C2F5E]/10 pl-4 md:pl-6' : ''}`}>
      <div className="rounded-[22px] border border-[#4C2F5E]/10 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CaseUserLink user={comment.author} className="flex min-w-0 items-center gap-3 rounded-[16px] transition hover:text-[#4C2F5E]">
            {comment.author.avatarUrl ? (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                className="h-10 w-10 rounded-full border border-[#4C2F5E]/10 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C2F5E] text-xs font-semibold text-white">
                {initials(comment.author.displayName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#2F1D3B]">{comment.author.displayName}</p>
              <p className="mt-1 text-xs text-[#8C7A9B]">
                {comment.author.organizationName ?? comment.author.roleLabel ?? 'Legal Hub member'}
              </p>
            </div>
          </CaseUserLink>

          <div className="flex flex-wrap items-center gap-2">
            {comment.author.isVerifiedLawyer ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            ) : null}
            <span className="text-xs text-[#8C7A9B]">{formatDate(comment.createdAt)}</span>
            {comment.editedAt ? (
              <span className="inline-flex items-center gap-1 text-xs text-[#8C7A9B]">
                <PencilLine className="h-3 w-3" />
                Edited
              </span>
            ) : null}
            {moderationTone ? (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${moderationTone}`}>
                <ShieldAlert className="h-3 w-3" />
                {comment.moderationState === 'FLAGGED' ? 'Flagged' : 'Under review'}
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-sm leading-7 text-[#635472]">{comment.body}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {comment.reactions.map((reaction) => (
            <span key={reaction.type} className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-[#F7F3FA] px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
              <Sparkles className="h-3.5 w-3.5" />
              {reaction.type.toLowerCase()} {reaction.count}
            </span>
          ))}
          <button className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1 text-xs font-semibold text-[#5D4D6D] transition hover:bg-[#FBF9FD]">
            <Reply className="h-3.5 w-3.5" />
            Reply
          </button>
        </div>
      </div>

      {comment.replies?.length ? (
        <div className="mt-4 space-y-4">
          <button
            type="button"
            onClick={() => setShowReplies((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-[#FBF9FD] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4C2F5E]"
          >
            {showReplies ? 'Hide replies' : `Load replies (${comment.replies.length})`}
          </button>
          {showReplies
            ? comment.replies.map((reply) => (
                <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export default function CaseCommentThread({ comments }: { comments: CaseCommentItem[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#4C2F5E] text-white">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Repository discussion</p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]">Comments</h2>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 md:p-6">
        <div className="mb-5 rounded-[24px] border border-dashed border-[#4C2F5E]/15 bg-white p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#2F1D3B]">Add repository commentary</p>
              <p className="mt-1 text-sm leading-7 text-[#6B5C79]">
                Keep commentary focused on holdings, source reliability, procedural posture, or practical interpretation.
              </p>
            </div>
            <span className="hidden rounded-full border border-[#4C2F5E]/10 bg-[#F7F3FA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4C2F5E] md:inline-flex">
              Structured discussion
            </span>
          </div>
          <textarea
            className="legal-field mt-4 h-28 resize-none"
            placeholder="Add a note about the holding, source provenance, or how this case should be interpreted in practice."
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#8C7A9B]">Comments follow repository moderation and visibility rules.</p>
            <button className="legal-button-primary text-sm">Post comment</button>
          </div>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} />
          ))}
        </div>
      </div>
    </section>
  );
}
