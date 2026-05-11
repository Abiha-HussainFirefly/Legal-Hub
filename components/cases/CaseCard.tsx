import PermissionGate from '../PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type CaseRecord = {
  id: string | number;
  authorId: string | number | null;
  title: string;
  summary: string;
  status: string;
};

type CaseCardProps = {
  caseItem: CaseRecord | null;
  currentUserId?: string | number | null;
  onBookmark?: (caseId: string | number) => void;
  onShare?: (caseId: string | number) => void;
  onEdit?: (caseId: string | number) => void;
  onSubmitForReview?: (caseId: string | number) => void;
};

const SUBMITTABLE_CASE_STATUSES = ['draft', 'rejected'] as const;

const CaseCard = ({
  caseItem,
  currentUserId = null,
  onBookmark,
  onShare,
  onEdit,
  onSubmitForReview,
}: CaseCardProps) => {
  const { can } = usePermissions();

  if (!caseItem) {
    return null;
  }

  const normalizedStatus = String(caseItem.status ?? '').toLowerCase();
  const isAuthor = Boolean(currentUserId) && currentUserId === caseItem.authorId;
  const canEditOwnCase =
    isAuthor &&
    can(PERMISSIONS.CASES_EDIT_OWN);
  const canSubmitOwnCase =
    isAuthor &&
    can(PERMISSIONS.CASES_SUBMIT_OWN_FOR_REVIEW) &&
    SUBMITTABLE_CASE_STATUSES.includes(normalizedStatus as "rejected" | "draft");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{caseItem.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{caseItem.summary}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            Status: {caseItem.status}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Controls whether the lawyer can bookmark case records. */}
          <PermissionGate permission={PERMISSIONS.CASES_BOOKMARK}>
            <button
              type="button"
              onClick={() => onBookmark?.(caseItem.id)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Bookmark
            </button>
          </PermissionGate>

          {/* Controls whether the lawyer can share case records. */}
          <PermissionGate permission={PERMISSIONS.CASES_SHARE}>
            <button
              type="button"
              onClick={() => onShare?.(caseItem.id)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              Share
            </button>
          </PermissionGate>

          {/* Controls whether the lawyer can edit their own case records. */}
          <PermissionGate permission={PERMISSIONS.CASES_EDIT_OWN}>
            {canEditOwnCase ? (
              <button
                type="button"
                onClick={() => onEdit?.(caseItem.id)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
              >
                Edit
              </button>
            ) : null}
          </PermissionGate>

          {/* Controls whether the lawyer can submit their own case records for review. */}
          <PermissionGate permission={PERMISSIONS.CASES_SUBMIT_OWN_FOR_REVIEW}>
            {canSubmitOwnCase ? (
              <button
                type="button"
                onClick={() => onSubmitForReview?.(caseItem.id)}
                className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
              >
                Submit for review
              </button>
            ) : null}
          </PermissionGate>
        </div>
      </div>
    </article>
  );
};

export default CaseCard;
