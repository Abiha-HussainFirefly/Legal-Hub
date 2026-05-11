import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type LogoutButtonProps = {
  onLogout?: () => void;
  className?: string;
};

const LogoutButton = ({ onLogout, className = '' }: LogoutButtonProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.AUTH_LOGOUT)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className={`rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${className}`.trim()}
    >
      Sign out
    </button>
  );
};

export default LogoutButton;
