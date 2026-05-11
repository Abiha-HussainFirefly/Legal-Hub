import PermissionGate from '../../components/PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type SavedWorkspacePageProps = {
  savedCases?: unknown[];
  savedDiscussions?: unknown[];
};

const SavedWorkspacePage = ({
  savedCases = [],
  savedDiscussions = [],
}: SavedWorkspacePageProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.SAVED_VIEW_SELF)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Saved workspace</h1>
        <p className="mt-2 text-sm text-slate-600">
          Centralize saved case research and saved discussion threads for the lawyer account.
        </p>
      </section>

      {/* Controls whether the lawyer can access saved cases in the workspace. */}
      <PermissionGate permission={PERMISSIONS.CASES_VIEW_SAVED_OWN}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Saved cases</h2>
          <p className="mt-2 text-sm text-slate-600">{savedCases.length} case items</p>
        </section>
      </PermissionGate>

      {/* Controls whether the lawyer can access saved discussions in the workspace. */}
      <PermissionGate permission={PERMISSIONS.DISCUSSIONS_VIEW_SAVED_OWN}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Saved discussions</h2>
          <p className="mt-2 text-sm text-slate-600">{savedDiscussions.length} discussion items</p>
        </section>
      </PermissionGate>
    </div>
  );
};

export default SavedWorkspacePage;
