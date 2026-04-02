'use client';

import { useSidebar } from '@/app/components/admin/sidebar/SidebarContext';
import { Bell, List, LogOut, Search, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface HeaderProps {
  userData?: {
    id?:          string;
    name?:        string;
    email?:       string;
    image?:       string;
    roles?:       string[];
    displayName?: string;
    role?:        string;
  } | null;
}

interface Notification {
  id:      number;
  title:   string;
  message: string;
  time:    string;
  read:    boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'New User Registered',   message: 'A new lawyer account is pending verification.',  time: '2 min ago',  read: false },
  { id: 2, title: 'Case Report Submitted', message: 'Case #1042 has been submitted for review.',       time: '15 min ago', read: false },
  { id: 3, title: 'System Alert',          message: 'Scheduled maintenance at 2:00 AM tonight.',       time: '1 hr ago',   read: false },
  { id: 4, title: 'User Suspended',        message: 'User "john.doe@example.com" has been suspended.', time: '3 hr ago',   read: true  },
  { id: 5, title: 'New Message',           message: 'You have a new message from the support team.',   time: 'Yesterday',  read: true  },
];

const SEARCH_DATA = [
  { id: 1,  label: 'Ali Hassan',       subLabel: 'ali@example.com',       type: 'User',      href: '/admin/users'        },
  { id: 2,  label: 'Fatima Khan',      subLabel: 'fatima@example.com',    type: 'User',      href: '/admin/users'        },
  { id: 3,  label: 'Mohsin Khan',      subLabel: 'mohsin@example.com',    type: 'User',      href: '/admin/users'        },
  { id: 4,  label: 'Sana Mirza',       subLabel: 'sana@example.com',      type: 'User',      href: '/admin/users'        },
  { id: 5,  label: 'Bilal Akhtar',     subLabel: 'bilal@example.com',     type: 'User',      href: '/admin/users'        },
  { id: 6,  label: 'Zara Hussain',     subLabel: 'zara@example.com',      type: 'User',      href: '/admin/users'        },
  { id: 7,  label: 'Omar Farooq',      subLabel: 'omar@example.com',      type: 'User',      href: '/admin/users'        },
  { id: 8,  label: 'Nida Malik',       subLabel: 'nida@example.com',      type: 'User',      href: '/admin/users'        },
  { id: 9,  label: 'Case #1042',       subLabel: 'Submitted for review',  type: 'Case',      href: '/admin/cases'        },
  { id: 10, label: 'Case #1038',       subLabel: 'Pending approval',      type: 'Case',      href: '/admin/cases'        },
  { id: 11, label: 'Case #1035',       subLabel: 'Resolved',              type: 'Case',      href: '/admin/cases'        },
  { id: 12, label: 'Mohsin Khan',      subLabel: 'BAR-12345 · Islamabad', type: 'Lawyer',    href: '/admin/verification' },
  { id: 13, label: 'Sana Ali',         subLabel: 'BAR-23456 · Karachi',   type: 'Lawyer',    href: '/admin/verification' },
  { id: 14, label: 'Hassan Raza',      subLabel: 'BAR-34567 · Lahore',    type: 'Lawyer',    href: '/admin/verification' },
  { id: 15, label: 'POST-4421',        subLabel: 'Harassment report',     type: 'Report',    href: '/admin/moderation'   },
  { id: 16, label: 'CASE-8892',        subLabel: 'Impersonation report',  type: 'Report',    href: '/admin/moderation'   },
  { id: 17, label: 'Scheduled Maint.', subLabel: 'System log · 2:00 AM',  type: 'Admin Log', href: '/admin/logs'         },
  { id: 18, label: 'User Suspended',   subLabel: 'john.doe@example.com',  type: 'Admin Log', href: '/admin/logs'         },
];

const TYPE_COLORS: Record<string, string> = {
  'User':      'bg-[#EBDEF0] text-[#4C2F5E]',
  'Lawyer':    'bg-purple-100 text-purple-700',
  'Case':      'bg-blue-50 text-blue-600',
  'Report':    'bg-orange-50 text-orange-600',
  'Admin Log': 'bg-gray-100 text-gray-600',
};

export default function Header({ userData }: HeaderProps) {
  const { isOpen, isMobile, toggle }     = useSidebar();
  const [isUserMenuOpen, setMenuOpen]    = useState(false);
  const [showMobileSearch, setMobSearch] = useState(false);
  const dropdownRef                      = useRef<HTMLDivElement>(null);
  const router                           = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotif] = useState(false);
  const notifRef                          = useRef<HTMLDivElement>(null);
  const unreadCount                       = notifications.filter(n => !n.read).length;

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef                     = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery.trim().length > 0
    ? SEARCH_DATA.filter(
        item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())    ||
          item.subLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.type.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleResultClick = (href: string) => {
    router.push(href);
    setSearchQuery('');
    setShowResults(false);
    setMobSearch(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  const user = {
    name:  userData?.name || userData?.displayName || 'Admin User',
    email: userData?.email || '',
    role:  Array.isArray(userData?.roles) && userData.roles.length > 0
         ? userData.roles.join(', ')
         : userData?.role || 'SYSTEM_ADMIN',
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      router.replace('/adminlogin');
    } catch (err) {
      console.error('Admin Logout Failed:', err);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const markRead = (id: number) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const leftOffset = isMobile ? '0px' : (isOpen ? '256px' : '72px');

  const SearchDropdown = () => (
    <>
      {showResults && searchQuery.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {searchResults.length > 0 ? (
            <>
              <div className="divide-y divide-gray-50">
                {searchResults.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleResultClick(item.href)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition text-left cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                      <p className="text-xs text-gray-400 truncate">{item.subLabel}</p>
                    </div>
                    <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-center">
                <p className="text-[11px] text-gray-400">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-gray-400">No results for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <header
      className="fixed top-0 right-0 z-10 bg-[#F3F0F4] transition-all duration-300"
      style={{ left: leftOffset }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center flex-1 min-w-0 gap-3 sm:gap-4">
          <button
            onClick={toggle}
            className="flex-shrink-0 text-gray-600 hover:text-[#4C2F5E] transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <List size={24} />
          </button>

          <div className="relative hidden sm:block w-full max-w-xs lg:max-w-md" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim().length > 0 && setShowResults(true)}
              placeholder="Search Admin Logs / User Records"
              className="block w-full pl-11 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <SearchDropdown />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <button
            className="sm:hidden p-2 rounded-full hover:bg-[#4C2F5E]/5 transition-colors text-[#4C2F5E] cursor-pointer"
            onClick={() => setMobSearch(v => !v)}
            aria-label="Search"
          >
            {showMobileSearch ? <X size={20} /> : <Search size={20} />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotif(v => !v)}
              className="relative p-2 rounded-full hover:bg-[#4C2F5E]/5 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-[#4C2F5E] fill-[#4C2F5E]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#9F63C4] rounded-full border-2 border-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-[#4C2F5E]">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-[#9F63C4] text-white px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-semibold text-[#9F63C4] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-gray-50 ${
                        !n.read ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <div className="mt-1.5 flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full ${!n.read ? 'bg-[#9F63C4]' : 'bg-gray-200'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${!n.read ? 'text-[#4C2F5E]' : 'text-gray-600'}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
                  <button
                    className="text-[11px] font-semibold text-[#9F63C4] hover:underline cursor-pointer"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="relative w-9 h-9 bg-transparent flex items-center justify-center transition-all active:scale-95 hover:opacity-80 outline-none border-none cursor-pointer"
              aria-label="User menu"
            >
              <Image
                src="/icons/user.png"
                alt="Admin Profile"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-800 z-50">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Image src="/icons/user.png" alt="Admin" width={35} height={35} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#4C2F5E] truncate uppercase">
                        {user.name}
                      </p>
                      <p className="text-[10px] font-bold text-[#9E63C4] lowercase tracking-wider">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ${
          showMobileSearch ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-3">
          <div className="relative" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim().length > 0 && setShowResults(true)}
              placeholder="Search Admin Logs / User Records"
              className="block w-full pl-11 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all shadow-sm"
              autoFocus={showMobileSearch}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <SearchDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
