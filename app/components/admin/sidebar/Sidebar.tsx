'use client';

import { BarChart3, Home, Settings, FileSearch, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/app/components/admin/sidebar/SidebarContext';

const menuItems = [
  { icon: Home,        label: 'Dashboard',    href: '/dashboard'    },
  { icon: ShieldCheck, label: 'Verification', href: '/verification' },
  { icon: FileSearch,  label: 'Moderation',   href: '/moderation'   },
  { icon: Users,       label: 'User',         href: '/user'         },
  { icon: BarChart3,   label: 'Reports',      href: '/reports'      },
  { icon: Settings,    label: 'Settings',     href: '/settings'     },
];

export default function Sidebar() {
  const pathname            = usePathname();
  const { isOpen, isMobile, close } = useSidebar();


  const sidebarWidth = isMobile
    ? (isOpen ? '256px' : '0px')
    : (isOpen ? '256px' : '72px');

  const showLabels = isOpen; 

  return (
    <>
      {/*  Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar  */}
      <aside
        className="min-h-screen fixed left-0 top-0 flex flex-col bg-[#F3F0F4] transition-all duration-300 overflow-hidden z-20"
        style={{ width: sidebarWidth }}
      >
        {/* Logo */}
        <div
          className="flex items-center transition-all duration-300 flex-shrink-0"
          style={{
            height:          '80px',
            padding:         showLabels ? '0 24px' : '0',
            justifyContent:  showLabels ? 'flex-start' : 'center',
          }}
        >
          {showLabels ? (
            <Link href="/" onClick={isMobile ? close : undefined} style={{ cursor: 'pointer' }}>
              <img src="/logo-legal-hub.png" alt="Legal Hub" className="h-12 w-auto" />
            </Link>
          ) : (
            <Link
              href="/"
              title="Legal Hub"
              style={{
                cursor:          'pointer',
                width:           '40px',
                height:          '40px',
                borderRadius:    '10px',
                background:      'linear-gradient(135deg, #9F63C4 0%, #7E4FA1 100%)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                flexShrink:      0,
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px', userSelect: 'none' }}>
                LH
              </span>
            </Link>
          )}
        </div>

        {/* Nav items  */}
        <nav className="flex-1 px-2 overflow-y-auto mt-5">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon     = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
  href={item.href}
  title={!showLabels ? item.label : undefined}
  onClick={isMobile ? close : undefined}
  className={`flex items-center transition-all duration-200
    ${showLabels 
      ? 'gap-4 py-3 px-4 rounded-xl text-sm font-semibold' 
      : 'justify-center p-0 mx-auto rounded-xl w-[44px] h-[44px]' 
    }
    ${isActive ? 'text-white shadow-md' : 'hover:bg-purple-50'}`}
  style={{
    cursor: 'pointer',
    ...(isActive
      ? { background: 'linear-gradient(135deg, #9F63C4 0%, #7E4FA1 100%)' }
      : { color: '#4C2F5E' }),
  }}
>
  <Icon
    className="w-6 h-6 flex-shrink-0"
    style={{ color: isActive ? '#fff' : '#4C2F5E' }}
  />
  
  {showLabels && (
    <span
      className="whitespace-nowrap transition-all duration-300 overflow-hidden"
      style={{
        opacity: 1,
        width: 'auto',
        maxWidth: '200px',
        lineHeight: '24px',
        fontSize: '16px'
      }}
    >
      {item.label}
    </span>
  )}
</Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
