import PermissionGate from '../../components/PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type MyTopicsPageProps = {
  topics?: unknown[];
};

const MyTopicsPage = ({
  topics = [],
}: MyTopicsPageProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.TOPICS_VIEW_SELF)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Topics</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review the discussion topics owned by the current lawyer user.
            </p>
          </div>

          {/* Controls whether the lawyer can start a new discussion from topics. */}
          <PermissionGate permission={PERMISSIONS.DISCUSSIONS_CREATE}>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              New discussion
            </button>
          </PermissionGate>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Owned topics</h2>
        <p className="mt-2 text-sm text-slate-600">{topics.length} tracked topics</p>
      </section>
    </div>
  );
};

export default MyTopicsPage;
