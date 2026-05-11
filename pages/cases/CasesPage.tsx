import PermissionGate from '../../components/PermissionGate';
import CaseCard from '../../components/cases/CaseCard';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type CaseRecord = {
  id: string | number;
  authorId: string | number | null;
  title: string;
  summary: string;
  status: string;
};

type CasesPageProps = {
  cases?: CaseRecord[];
  currentUserId?: string | number | null;
};

const CasesPage = ({
  cases = [],
  currentUserId = null,
}: CasesPageProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.CASES_VIEW)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Cases</h1>
            <p className="mt-2 text-sm text-slate-600">
              Search the lawyer-facing case repository and manage your own submissions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Controls whether the lawyer can create case drafts. */}
            <PermissionGate permission={PERMISSIONS.CASES_CREATE_DRAFT}>
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Create draft
              </button>
            </PermissionGate>

            {/* Controls whether the lawyer can access their case dashboard. */}
            <PermissionGate permission={PERMISSIONS.CASES_VIEW_OWN_DASHBOARD}>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                My Cases
              </button>
            </PermissionGate>
          </div>
        </div>
      </section>

      {/* Controls whether the lawyer can view case filter metadata. */}
      <PermissionGate permission={PERMISSIONS.CASES_META_VIEW}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" placeholder="Court" />
            <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" placeholder="Region" />
            <input className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" placeholder="Category" />
          </div>
        </section>
      </PermissionGate>

      <div className="grid gap-4">
        {cases.map((caseItem) => (
          <CaseCard
            key={caseItem.id}
            caseItem={caseItem}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default CasesPage;
