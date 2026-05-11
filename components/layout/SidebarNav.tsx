'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS, type Permission } from '../../utils/permissions';

type NavItem = {
  key: string;
  label: string;
  to: string;
  permission: Permission;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'discussions',
    label: 'Discussions',
    to: '/discussions',
    permission: PERMISSIONS.DISCUSSIONS_VIEW,
  },
  {
    key: 'cases',
    label: 'Cases',
    to: '/cases',
    permission: PERMISSIONS.CASES_VIEW,
  },
  {
    key: 'myCases',
    label: 'My Cases',
    to: '/my-cases',
    permission: PERMISSIONS.CASES_VIEW_OWN_DASHBOARD,
  },
  {
    key: 'profile',
    label: 'Profile',
    to: '/profile',
    permission: PERMISSIONS.PROFILE_VIEW_SELF,
  },
  {
    key: 'saved',
    label: 'Saved',
    to: '/saved',
    permission: PERMISSIONS.SAVED_VIEW_SELF,
  },
  {
    key: 'topics',
    label: 'My Topics',
    to: '/my-topics',
    permission: PERMISSIONS.TOPICS_VIEW_SELF,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    to: '/notifications',
    permission: PERMISSIONS.NOTIFICATIONS_VIEW_SELF,
  },
  {
    key: 'account',
    label: 'Account Settings',
    to: '/account',
    permission: PERMISSIONS.ACCOUNT_VIEW_SELF,
  },
];

const SidebarNav = () => {
  const { can } = usePermissions();
  const pathname = usePathname(); // Get current path to check active state

  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <aside className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <nav className="space-y-2">
        {visibleItems.map((item) => {
          // Check if current pathname matches the link destination
          const isActive = pathname === item.to || pathname?.startsWith(`${item.to}/`);

          return (
            <Link
              key={item.key}
              href={item.to}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SidebarNav;