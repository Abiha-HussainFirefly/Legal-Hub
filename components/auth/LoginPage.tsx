import Link from 'next/link';
import PermissionGate from '../../components/PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

const LoginPage = () => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.AUTH_LOGIN)) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Lawyer sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access the lawyer workspace for discussions, cases, saved research, and profile management.
        </p>

        <form className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500"
              placeholder="lawyer@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm">
          <PermissionGate permission={PERMISSIONS.AUTH_REGISTER}>
            <Link href="/register" className="font-medium text-slate-900 hover:underline">
              Create account
            </Link>
          </PermissionGate>

          <PermissionGate permission={PERMISSIONS.AUTH_PASSWORD_RESET}>
            <Link href="/forgot-password" className="font-medium text-slate-900 hover:underline">
              Forgot password?
            </Link>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;