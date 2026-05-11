import PermissionGate from '../../components/PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type ProfileSummary = {
  displayName: string;
  headline: string;
  bio: string;
};

type MyProfilePageProps = {
  profile?: ProfileSummary;
};

const MyProfilePage = ({
  profile = {
    displayName: 'Lawyer User',
    headline: 'Legal professional',
    bio: 'Profile summary goes here.',
  },
}: MyProfilePageProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.PROFILE_VIEW_SELF)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{profile.displayName}</h1>
            <p className="mt-2 text-sm text-slate-600">{profile.headline}</p>
            <p className="mt-4 text-sm leading-6 text-slate-700">{profile.bio}</p>
          </div>

          {/* Controls whether the lawyer can edit their professional profile. */}
          <PermissionGate permission={PERMISSIONS.PROFILE_EDIT_SELF}>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Edit profile
            </button>
          </PermissionGate>
        </div>
      </section>

      {/* Controls whether the lawyer can complete profile setup. */}
      <PermissionGate permission={PERMISSIONS.PROFILE_SETUP_SELF}>
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-900">Complete your profile setup</h2>
          <p className="mt-2 text-sm text-blue-800">
            Add the missing professional details required for a complete lawyer-facing presence.
          </p>
        </section>
      </PermissionGate>

      {/* Controls whether the lawyer can view profile statistics. */}
      <PermissionGate permission={PERMISSIONS.PROFILE_STATS_VIEW_SELF}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile stats</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Profile views</div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Saved discussions</div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Case contributions</div>
          </div>
        </section>
      </PermissionGate>

      {/* Controls whether the lawyer can manage profile visibility settings. */}
      <PermissionGate permission={PERMISSIONS.PROFILE_VISIBILITY_MANAGE_SELF}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Visibility settings</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              Public biography
              <input type="checkbox" className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              Practice areas
              <input type="checkbox" className="h-4 w-4" />
            </label>
          </div>
        </section>
      </PermissionGate>
    </div>
  );
};

export default MyProfilePage;
