'use client';

import {
    CheckCircle,
    FileText,
    LayoutDashboard,
    Settings,
    Shield,
    Users
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// At the top with other imports
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: CheckCircle, label: 'Verification', href: '/verification' },
  { icon: Shield, label: 'Moderation', href: '/moderation' },
  { icon: Users, label: 'User', href: '/user' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
      {/* Logo */}
      
<div className="p-6 border-b border-gray-200">
  <Link href="/" className="flex items-center">
    <img 
      src="/logo-legal-hub.png" 
      alt="Legal Hub" 
      className="h-12 w-auto"
    />
  </Link>
</div>

      {/* Menu */}
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
