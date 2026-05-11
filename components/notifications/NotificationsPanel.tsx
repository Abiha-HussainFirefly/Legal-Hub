import PermissionGate from '../../components/PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type NotificationRecord = {
  id: string | number;
  title: string;
  message: string;
};

type NotificationsPanelProps = {
  notifications?: NotificationRecord[];
  markRead?: (notificationId: string | number) => Promise<void>;
  markAllRead?: () => Promise<void>;
};

const noop = async () => {};

const NotificationsPanel = ({
  notifications = [],
  markRead = noop,
  markAllRead = noop,
}: NotificationsPanelProps) => {
  const { can } = usePermissions();

  if (!can(PERMISSIONS.NOTIFICATIONS_VIEW_SELF)) {
    return null;
  }

  const handleNotificationClick = async (notificationId: string | number) => {
    if (can(PERMISSIONS.NOTIFICATIONS_MARK_READ_SELF)) {
      await markRead(notificationId);
    }
  };

  const handleMarkAllRead = async () => {
    if (can(PERMISSIONS.NOTIFICATIONS_MARK_READ_SELF)) {
      await markAllRead();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review discussion, answer, and case activity relevant to this lawyer account.
          </p>
        </div>

        {/* Controls whether the lawyer can mark all notifications as read. */}
        <PermissionGate permission={PERMISSIONS.NOTIFICATIONS_MARK_READ_SELF}>
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Mark all read
          </button>
        </PermissionGate>
      </div>

      <div className="mt-6 space-y-3">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => handleNotificationClick(notification.id)}
            className="block w-full rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
          >
            <p className="text-sm font-medium text-slate-900">{notification.title}</p>
            <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default NotificationsPanel;
