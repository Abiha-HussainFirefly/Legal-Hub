import PermissionGate from '../PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type DiscussionRecord = {
  id: string | number;
  authorId: string | number | null;
  title: string;
  body: string;
  category: string;
  hasAiSummary?: boolean;
};

type DiscussionCardProps = {
  discussion: DiscussionRecord | null;
  currentUserId?: string | number | null;
  onReact?: (discussionId: string | number) => void;
  onBookmark?: (discussionId: string | number) => void;
  onFollow?: (discussionId: string | number) => void;
  onEdit?: (discussionId: string | number) => void;
  onDelete?: (discussionId: string | number) => void;
};

const DiscussionCard = ({
  discussion,
  currentUserId = null,
  onReact,
  onBookmark,
  onFollow,
  onEdit,
  onDelete,
}: DiscussionCardProps) => {
  const { canAll } = usePermissions();

  if (!discussion) {
    return null;
  }

  const isAuthor = Boolean(currentUserId) && currentUserId === discussion.authorId;
  const canManageOwnDiscussion =
    isAuthor &&
    canAll([
      PERMISSIONS.DISCUSSIONS_EDIT_OWN,
      PERMISSIONS.DISCUSSIONS_DELETE_OWN,
    ]);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="w-full">
          <h2 className="text-lg font-semibold text-slate-900">{discussion.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{discussion.body}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            {discussion.category}
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2">
          {/* Controls whether the lawyer can see AI summary availability on a discussion. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_AI_SUMMARY_VIEW}>
            {discussion.hasAiSummary ? (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                AI summary
              </span>
            ) : null}
          </PermissionGate>

          {/* Controls whether the lawyer can react to a discussion. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_REACT}>
            <button
              type="button"
              onClick={() => onReact?.(discussion.id)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              React
            </button>
          </PermissionGate>

          {/* Controls whether the lawyer can bookmark a discussion. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_BOOKMARK}>
            <button
              type="button"
              onClick={() => onBookmark?.(discussion.id)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Bookmark
            </button>
          </PermissionGate>

          {/* Controls whether the lawyer can follow a discussion. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_FOLLOW}>
            <button
              type="button"
              onClick={() => onFollow?.(discussion.id)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Follow
            </button>
          </PermissionGate>

          {/* Controls whether the lawyer can manage their own discussion. */}
          <PermissionGate
            allOf={[
              PERMISSIONS.DISCUSSIONS_EDIT_OWN,
              PERMISSIONS.DISCUSSIONS_DELETE_OWN,
            ]}
          >
            {canManageOwnDiscussion ? (
              <>
                <button
                  type="button"
                  onClick={() => onEdit?.(discussion.id)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(discussion.id)}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700"
                >
                  Delete
                </button>
              </>
            ) : null}
          </PermissionGate>
        </div>
      </div>
    </article>
  );
};

export default DiscussionCard;
