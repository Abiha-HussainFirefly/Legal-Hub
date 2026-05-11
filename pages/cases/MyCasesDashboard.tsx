import PermissionGate from '../../components/PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type MyCasesDashboardProps = {
  draftCases?: unknown[];
  publishedCases?: unknown[];
  savedCases?: unknown[];
};

const MyCasesDashboard = ({
  draftCases = [],
  publishedCases = [],
  savedCases = [],
}: MyCasesDashboardProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.CASES_VIEW_OWN_DASHBOARD)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">My Cases</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review the lawyer&apos;s own case submissions and workspace collections.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Published cases</h2>
        <p className="mt-2 text-sm text-slate-600">{publishedCases.length} published items</p>
      </section>

      {/* Controls whether the lawyer can view drafts and pending unpublished records. */}
      <PermissionGate permission={PERMISSIONS.CASES_VIEW_OWN_UNPUBLISHED}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Drafts and pending review</h2>
          <p className="mt-2 text-sm text-slate-600">{draftCases.length} unpublished items</p>
        </section>
      </PermissionGate>

      {/* Controls whether the lawyer can access their saved cases tab. */}
      <PermissionGate permission={PERMISSIONS.CASES_VIEW_SAVED_OWN}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Saved cases</h2>
          <p className="mt-2 text-sm text-slate-600">{savedCases.length} saved items</p>
        </section>
      </PermissionGate>
    </div>
  );
};

export default MyCasesDashboard;
