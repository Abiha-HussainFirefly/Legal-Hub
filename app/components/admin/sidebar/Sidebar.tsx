'use client';

import ThemeModeSelector from '@/app/components/theme/ThemeModeSelector';
import { ADMIN_PERMISSION_KEYS, canAccessAdminPortal, canAccessAdminPermission, getAdminPermissionForPath } from '@/lib/auth/roles';
import { useSidebar } from '@/app/components/admin/sidebar/SidebarContext';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  BellRing,
  BriefcaseBusiness,
  ChevronDown,
  Download,
  FileSearch,
  FolderSearch,
  Home,
  KeyRound,
  ListChecks,
  LogOut,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Tags,
  User,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const menuSections = [
  {
    title: 'Command',
    items: [
      { icon: Home, label: 'Dashboard', href: '/dashboard' },
      { icon: BarChart3, label: 'Reports', href: '/reports' },
      { icon: Download, label: 'Exports', href: '/exports' },
    ],
  },
  {
    title: 'Identity',
    items: [
      { icon: Users, label: 'Users', href: '/user' },
      { icon: KeyRound, label: 'Roles', href: '/roles' },
      { icon: ListChecks, label: 'Permissions', href: '/permissions' },
      { icon: ShieldCheck, label: 'Verification', href: '/verification' },
      { icon: Settings, label: 'Security', href: '/settings' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: BriefcaseBusiness, label: 'Cases', href: '/case-review' },
      { icon: MessageSquareText, label: 'Discussions', href: '/discussion-ops' },
      { icon: FileSearch, label: 'Moderation', href: '/moderation' },
      { icon: FolderSearch, label: 'Files', href: '/files' },
      { icon: BellRing, label: 'Notifications', href: '/notifications' },
      { icon: Activity, label: 'System Jobs', href: '/system-jobs' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { icon: Tags, label: 'Taxonomy', href: '/taxonomy' },
      { icon: Award, label: 'Gamification', href: '/gamification' },
    ],
  },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  relatedHref?: string | null;
  relatedLabel?: string | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, isMobile } = useSidebar();
  const { data: session } = useSession();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isUserMenuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const sidebarWidth = isMobile ? (isOpen ? '256px' : '0px') : isOpen ? '256px' : '72px';
  const showLabels = isOpen;
  const sessionRoles = ((session?.user as { roles?: string[] } | undefined)?.roles ?? []).filter(Boolean);
  const sessionPermissions = ((session?.user as { permissions?: string[] } | undefined)?.permissions ?? []).filter(Boolean);

  const visibleMenuSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const requiredPermission = getAdminPermissionForPath(item.href);

        if (!requiredPermission) {
          return canAccessAdminPortal(sessionRoles);
        }

        return canAccessAdminPermission(sessionRoles, sessionPermissions, requiredPermission);
      }),
    }))
    .filter((section) => section.items.length > 0);
  const canViewShellNotifications = canAccessAdminPermission(
    sessionRoles,
    sessionPermissions,
    ADMIN_PERMISSION_KEYS.NOTIFICATIONS_MANAGE,
  );

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/adminlogin');
  };

  useEffect(() => {
    let ignore = false;

    async function loadNotifications() {
      if (!canViewShellNotifications) {
        setNotifications([]);
        setUnreadCount(0);
        setNotificationsLoading(false);
        return;
      }

      setNotificationsLoading(true);

      try {
        const response = await fetch('/api/admin/shell-notifications?limit=6', { cache: 'no-store' });
        if (!response.ok) return;

        const payload = await response.json();
        if (ignore) return;

        setUnreadCount(typeof payload.unreadCount === 'number' ? payload.unreadCount : 0);
        setNotifications(
          Array.isArray(payload.items)
            ? payload.items.map(
                (item: {
                  id: string;
                  title: string;
                  message: string | null;
                  relativeTime: string;
                  isRead: boolean;
                  relatedHref?: string | null;
                  relatedLabel?: string | null;
                }) => ({
                  id: item.id,
                  title: item.title,
                  message: item.message ?? '',
                  time: item.relativeTime,
                  read: item.isRead,
                  relatedHref: item.relatedHref ?? null,
                  relatedLabel: item.relatedLabel ?? null,
                }),
              )
            : [],
        );
      } catch (error) {
        console.error('Failed to load admin shell notifications', error);
      } finally {
        if (!ignore) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, [canViewShellNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActiveLink = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <aside
      className="fixed left-0 top-0 z-20 flex h-screen flex-col overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--background-card-nested)] transition-all duration-300"
      style={{ width: sidebarWidth }}
    >
      <div className="flex h-[80px] shrink-0 items-center px-4">
        {showLabels ? (
          <Image src="/logo-legal-hub.png" alt="Legal Hub" width={144} height={48} className="h-12 w-auto" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#9F63C4] to-[#7E4FA1] font-bold text-white">
            LH
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showNotifications && showLabels ? (
          <div className="flex h-full min-h-0 flex-col bg-white/40 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#9F63C4]" />
                <p className="text-sm font-bold text-[#4C2F5E]">Notifications</p>
              </div>
              <Link href="/notifications" className="text-[10px] font-bold uppercase text-[#9F63C4] hover:underline">
                Open Center
              </Link>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto divide-y divide-gray-100">
              {notificationsLoading ? (
                <div className="px-4 py-6 text-sm text-slate-500">Loading live notifications...</div>
              ) : notifications.length ? (
                notifications.map((n) => {
                  const body = (
                    <div
                      className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-white ${
                        !n.read ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <div className="mt-1 shrink-0">
                        <div className={`h-2 w-2 rounded-full ${!n.read ? 'bg-[#9F63C4]' : 'bg-gray-200'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between">
                          <p className={`truncate text-xs font-semibold ${!n.read ? 'text-[#4C2F5E]' : 'text-gray-600'}`}>
                            {n.title}
                          </p>
                          <span className="ml-2 whitespace-nowrap text-[9px] text-gray-400">{n.time}</span>
                        </div>
                        {n.message ? <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">{n.message}</p> : null}
                        {n.relatedLabel ? (
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">
                            {n.relatedLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );

                  return n.relatedHref ? (
                    <Link key={n.id} href={n.relatedHref} onClick={() => setShowNotifications(false)} className="block">
                      {body}
                    </Link>
                  ) : (
                    <div key={n.id}>{body}</div>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-sm text-slate-500">No notifications are available in the database yet.</div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50/30 p-3">
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full rounded-lg border border-gray-200 py-2 text-[11px] font-bold text-gray-500 transition-colors hover:bg-gray-100"
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : (
          <nav className="custom-scrollbar mt-5 flex-1 overflow-y-auto px-2">
            <div className="space-y-5 pb-5">
              {visibleMenuSections.map((section) => (
                <div key={section.title} className={showLabels ? 'lh-sidebar-section' : ''}>
                  {showLabels ? (
                    <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7A9B]">
                      {section.title}
                    </p>
                  ) : null}
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isActiveLink(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setShowNotifications(false)}
                            className={`flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] text-white shadow-sm'
                                : 'text-[#4C2F5E] hover:bg-purple-50 hover:text-[#4C2F5E]'
                            }`}
                          >
                            <Icon className="h-6 w-6 shrink-0" />
                            {showLabels ? <span className="font-semibold">{item.label}</span> : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        )}
      </div>

      <div className="relative mt-auto shrink-0" ref={dropdownRef}>
        {isUserMenuOpen ? (
          <div className="animate-in slide-in-from-bottom-2 mx-2 mb-2 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--background-surface)] shadow-2xl duration-200">
            <div className="space-y-0.5 p-2">
              <button
                onClick={() => {
                  router.push('/adminprofile');
                  setMenuOpen(false);
                  setShowNotifications(false);
                }}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <span>Profile</span>
                <User size={15} className="text-gray-400" />
              </button>

              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setMenuOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  showNotifications ? 'bg-purple-50 text-[#9F63C4]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{showNotifications ? 'Hide Notifications' : 'Notifications'}</span>
                  {!showNotifications && unreadCount > 0 ? (
                    <span className="rounded-full bg-[#9F63C4] px-1.5 text-[10px] text-white">{unreadCount}</span>
                  ) : null}
                </div>
                {showNotifications ? <ChevronDown size={15} /> : <Bell size={15} className="text-gray-400" />}
              </button>

              <ThemeModeSelector className="mt-2" />

              <div className="mx-2 my-1 h-px bg-[var(--border-subtle)]" />

              <button
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                <span>Logout</span>
                <LogOut size={15} className="text-red-400" />
              </button>
            </div>

            <div className="h-px bg-[var(--border-subtle)]" />
            <div className="flex items-center gap-3 bg-[var(--background-card-nested)] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4C2F5E] text-sm font-bold text-white">
                {getInitials(session?.user?.name)}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold leading-tight text-[#4C2F5E]">
                  {session?.user?.name ?? session?.user?.email ?? 'Authenticated admin'}
                </span>
                <span className="truncate text-[10px] font-medium text-[#9F63C4]">
                  {session?.user?.email ?? 'No email on record'}
                </span>
                <div className="mt-1 flex">
                  <span className="rounded bg-[#4C2F5E] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => setMenuOpen(!isUserMenuOpen)}
          className={`flex w-full cursor-pointer items-center gap-3 border-t border-[var(--border-subtle)] p-4 transition-colors hover:bg-[var(--background-surface)] ${
            !showLabels ? 'justify-center' : ''
          }`}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4C2F5E] text-sm font-bold text-white shadow-sm">
            {getInitials(session?.user?.name)}
            {!showNotifications && unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--background-card-nested)] bg-[#9F63C4] text-[8px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>
          {showLabels ? (
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-bold text-[#4C2F5E]">
                {session?.user?.name ?? session?.user?.email ?? 'Authenticated admin'}
              </span>
              <span className="truncate text-[11px] font-semibold text-[#9F63C4]">
                {showNotifications ? 'Live Notification Feed' : 'View Profile'}
              </span>
            </div>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
