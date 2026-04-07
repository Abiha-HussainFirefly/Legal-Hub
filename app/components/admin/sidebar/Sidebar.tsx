'use client';

import { useSidebar } from '@/app/components/admin/sidebar/SidebarContext';
import {
  BarChart3,
  Bell,
  ChevronDown,
  FileSearch,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Users
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const menuItems = [
  { icon: Home,         label: 'Dashboard',   href: '/dashboard'   },
  { icon: ShieldCheck, label: 'Verification', href: '/verification' },
  { icon: FileSearch,  label: 'Moderation',  href: '/moderation'   },
  { icon: Users,       label: 'User',        href: '/user'        },
  { icon: BarChart3,   label: 'Reports',     href: '/reports'     },
  { icon: Settings,    label: 'Settings',    href: '/settings'    },
];

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'info' | 'warning' | 'success';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'New user registered',  message: 'A new lawyer has signed up and is pending verification.', time: '2 min ago',  read: false, type: 'info'    },
  { id: '2', title: 'Report submitted',     message: 'A moderation report has been filed for review.',          time: '1 hr ago',  read: false, type: 'warning' },
  { id: '3', title: 'Settings updated',    message: 'System settings were updated successfully.',              time: 'Yesterday', read: true,  type: 'success' },
  { id: '4', title: 'Database Backup',     message: 'Automated nightly backup completed without errors.',       time: '2 days ago',read: true,  type: 'success' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { isOpen, isMobile } = useSidebar();
  const { data: session }    = useSession();

  const [notifications, setNotifications]         = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isUserMenuOpen, setMenuOpen]             = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const sidebarWidth = isMobile ? (isOpen ? '256px' : '0px') : (isOpen ? '256px' : '72px');
  const showLabels   = isOpen;
  const unreadCount  = notifications.filter(n => !n.read).length;

  const getInitials = (name?: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const markRead    = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/adminlogin');
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <aside
      className="min-h-screen fixed left-0 top-0 flex flex-col bg-[#F3F0F4] transition-all duration-300 z-20 border-r border-gray-200 overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      {/* Logo */}
      <div className="flex items-center h-[80px] px-4 shrink-0">
        {showLabels ? (
          <img src="/logo-legal-hub.png" alt="Legal Hub" className="h-12 w-auto" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9F63C4] to-[#7E4FA1] flex items-center justify-center text-white font-bold">
            LH
          </div>
        )}
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showNotifications && showLabels ? (
          
          <div className="flex flex-col h-full bg-white/40 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#9F63C4]" />
                <p className="font-bold text-sm text-[#4C2F5E]">Notifications</p>
              </div>
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-[#9F63C4] hover:underline uppercase"
              >
                Mark all read
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-4 transition-colors cursor-pointer hover:bg-white ${
                    !n.read ? 'bg-purple-50/40' : ''
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-[#9F63C4]' : 'bg-gray-200'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-xs font-semibold truncate ${!n.read ? 'text-[#4C2F5E]' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/30">
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                Back to Menu
              </button>
            </div>
          </div>
        ) : (
          
          <nav className="flex-1 px-2 mt-5 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon     = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setShowNotifications(false)}
                      className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'text-white bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1] shadow-sm'
                          : 'text-[#4C2F5E] hover:bg-purple-50'
                      }`}
                    >
                      <Icon className="w-6 h-6 shrink-0" />
                      {showLabels && <span className="font-semibold">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>

      
      <div className="mt-auto shrink-0 relative" ref={dropdownRef}>
        
        {isUserMenuOpen && (
          <div className="mx-2 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-2 space-y-0.5">
              <button
                onClick={() => { router.push('/adminprofile'); setMenuOpen(false); setShowNotifications(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition cursor-pointer"
              >
                <span>Profile</span>
                <User size={15} className="text-gray-400" />
              </button>

              <button
                onClick={() => { setShowNotifications(!showNotifications); setMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer ${
                  showNotifications ? 'bg-purple-50 text-[#9F63C4]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{showNotifications ? 'Hide Notifications' : 'Notifications'}</span>
                  {!showNotifications && unreadCount > 0 && (
                    <span className="bg-[#9F63C4] text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                {showNotifications ? <ChevronDown size={15} /> : <Bell size={15} className="text-gray-400" />}
              </button>

              <div className="h-px bg-gray-100 my-1 mx-2" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
              >
                <span>Logout</span>
                <LogOut size={15} className="text-red-400" />
              </button>
            </div>

            {/* User Info Card */}
            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/50">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4C2F5E] text-white font-bold text-sm">
                {getInitials(session?.user?.name)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-[#4C2F5E] truncate leading-tight">
                  {session?.user?.name ?? 'Admin User'}
                </span>
                <span className="text-[10px] text-[#9F63C4] font-medium truncate">
                  {session?.user?.email ?? 'admin@legalhub.com'}
                </span>
                <div className="mt-1 flex">
                  <span className="text-[9px] font-bold text-white bg-[#4C2F5E] px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setMenuOpen(!isUserMenuOpen)}
          className={`w-full flex items-center gap-3 p-4 border-t border-gray-200 hover:bg-white transition-colors cursor-pointer ${!showLabels ? 'justify-center' : ''}`}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4C2F5E] text-white font-bold text-sm shadow-sm">
            {getInitials(session?.user?.name)}
            {!showNotifications && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#9F63C4] rounded-full border-2 border-[#F3F0F4] flex items-center justify-center text-[8px] text-white font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {showLabels && (
            <div className="flex flex-col min-w-0 text-left">
              <span className="truncate text-sm font-bold text-[#4C2F5E]">
                {session?.user?.name ?? 'Admin User'}
              </span>
              <span className="text-[11px] text-[#9F63C4] font-semibold truncate">
                {showNotifications ? 'Viewing Notifications' : 'View Profile'}
              </span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}