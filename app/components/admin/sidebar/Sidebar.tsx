'use client';

import { BarChart3, Home, Settings, FileSearch, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/app/components/admin/sidebar/SidebarContext';
import { useSession } from 'next-auth/react';

const menuItems = [
  { icon: Home,         label: 'Dashboard',    href: '/dashboard'    },
  { icon: ShieldCheck, label: 'Verification', href: '/verification' },
  { icon: FileSearch,  label: 'Moderation',   href: '/moderation'   },
  { icon: Users,       label: 'User',         href: '/user'         },
  { icon: BarChart3,   label: 'Reports',      href: '/reports'      },
  { icon: Settings,    label: 'Settings',     href: '/settings'     },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isMobile, close } = useSidebar();
  const { data: session } = useSession();

  const sidebarWidth = isMobile ? (isOpen ? '256px' : '0px') : (isOpen ? '256px' : '72px');
  const showLabels = isOpen;

  const getInitials = (name?: string | null) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <aside
      className="min-h-screen fixed left-0 top-0 flex flex-col bg-[#F3F0F4] transition-all duration-300 z-20 border-r border-gray-200"
      style={{ width: sidebarWidth }}
    >
      {/* Logo Section */}
      <div className="flex items-center h-[80px] px-6">
        {showLabels ? (
          <img src="/logo-legal-hub.png" alt="Legal Hub" className="h-12 w-auto" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9F63C4] to-[#7E4FA1] flex items-center justify-center text-white font-bold">LH</div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 mt-5">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all ${isActive ? 'text-white bg-gradient-to-r from-[#9F63C4] to-[#7E4FA1]' : 'text-[#4C2F5E] hover:bg-purple-50'}`}
                >
                  <Icon className="w-6 h-6 shrink-0" />
                  {showLabels && <span className="font-semibold">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile Section - Clicking the icon opens settings */}
      <div className={`mt-auto border-t border-gray-200 p-4 ${!showLabels ? 'flex justify-center' : ''}`}>
        <Link 
          href="/adminprofile" 
          title={session?.user?.name || "Profile Settings"} 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4C2F5E] text-white font-bold text-sm shadow-sm">
            {getInitials(session?.user?.name)}
          </div>
          {showLabels && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold text-[#4C2F5E]">{session?.user?.name}</span>
              <span className="text-[10px] text-gray-400 font-medium">ADMIN</span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}