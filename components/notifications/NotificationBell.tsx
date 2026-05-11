import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type NotificationBellProps = {
  unreadCount?: number;
  onClick?: () => void;
};

const NotificationBell = ({
  unreadCount = 0,
  onClick,
}: NotificationBellProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.NOTIFICATIONS_VIEW_SELF)) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-full border border-slate-300 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
      aria-label="Open notifications"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.41V11a6 6 0 1 0-12 0v3.19a2 2 0 0 1-.59 1.41L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9"
        />
      </svg>
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </button>
  );
};

export default NotificationBell;
