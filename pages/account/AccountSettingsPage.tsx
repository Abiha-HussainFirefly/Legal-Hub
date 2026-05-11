import { useState } from 'react';
import PermissionGate from '../../components/PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type ProfileFormState = {
  fullName: string;
  phone: string;
};

type PasswordFormState = {
  currentPassword: string;
  nextPassword: string;
};

const AccountSettingsPage = () => {
  const { can } = usePermissions();
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    fullName: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    nextPassword: '',
  });

  if (!can(PERMISSIONS.ACCOUNT_VIEW_SELF)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Controls whether the lawyer can access account settings. */}
      <PermissionGate permission={PERMISSIONS.ACCOUNT_VIEW_SELF}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Account settings</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage the account-level settings attached to the authenticated lawyer profile.
          </p>
        </section>

        {/* Controls whether the lawyer can edit account details. */}
        <PermissionGate permission={PERMISSIONS.ACCOUNT_EDIT_SELF}>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Basic details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={profileForm.fullName}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, fullName: event.target.value }))
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="Full name"
              />
              <input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, phone: event.target.value }))
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="Phone number"
              />
            </div>
          </section>
        </PermissionGate>

        {/* Controls whether the lawyer can change their own password. */}
        <PermissionGate permission={PERMISSIONS.ACCOUNT_PASSWORD_CHANGE_SELF}>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="Current password"
              />
              <input
                type="password"
                value={passwordForm.nextPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="New password"
              />
            </div>
          </section>
        </PermissionGate>
      </PermissionGate>
    </div>
  );
};

export default AccountSettingsPage;
