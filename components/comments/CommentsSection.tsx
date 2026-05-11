import { useState } from 'react';
import PermissionGate from '../PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type CommentRecord = {
  id: string | number;
  authorName: string;
  body: string;
};

type CommentsSectionProps = {
  comments?: CommentRecord[];
  onCreateComment?: (draftComment: string) => void;
  onReply?: (commentId: string | number) => void;
  onReactComment?: (commentId: string | number) => void;
};

const CommentsSection = ({
  comments = [],
  onCreateComment,
  onReply,
  onReactComment,
}: CommentsSectionProps) => {
  const { can } = usePermissions();
  const [draftComment, setDraftComment] = useState('');

  if (!can(PERMISSIONS.COMMENTS_VIEW)) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Comments</h2>

      <div className="mt-6 space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{comment.authorName}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{comment.body}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Controls whether the lawyer can react to comments. */}
                <PermissionGate permission={PERMISSIONS.COMMENTS_REACT}>
                  <button
                    type="button"
                    onClick={() => onReactComment?.(comment.id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    React
                  </button>
                </PermissionGate>

                {/* Controls whether the lawyer can reply to comment threads. */}
                <PermissionGate permission={PERMISSIONS.COMMENTS_CREATE}>
                  <button
                    type="button"
                    onClick={() => onReply?.(comment.id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    Reply
                  </button>
                </PermissionGate>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Controls whether the lawyer can compose a comment. */}
      <PermissionGate permission={PERMISSIONS.COMMENTS_CREATE}>
        <div className="mt-6 border-t border-slate-200 pt-6">
          <label htmlFor="commentDraft" className="mb-2 block text-sm font-medium text-slate-700">
            Add comment
          </label>
          <textarea
            id="commentDraft"
            value={draftComment}
            onChange={(event) => setDraftComment(event.target.value)}
            className="min-h-[100px] w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
            placeholder="Write a comment"
          />
          <button
            type="button"
            onClick={() => onCreateComment?.(draftComment)}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Post comment
          </button>
        </div>
      </PermissionGate>
    </section>
  );
};

export default CommentsSection;
