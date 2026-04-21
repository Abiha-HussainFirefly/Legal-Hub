'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, BriefcaseBusiness, LayoutGrid, LogOut, Menu, MessageSquareText, User, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type ActiveTab = 'discussions' | 'cases' | 'topics' | 'saved';

interface LawyerTopbarProps {
  activeTab: ActiveTab;
  user?: {
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null;
  onLogout?: () => Promise<void> | void;
  extraActions?: React.ReactNode;
}

const navItems: { id: ActiveTab; href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'discussions', href: '/discussions', label: 'Discussions', icon: MessageSquareText },
  { id: 'cases', href: '/cases', label: 'Case Repository', icon: BriefcaseBusiness },
  { id: 'topics', href: '/topics', label: 'My Topics', icon: LayoutGrid },
  { id: 'saved', href: '/saved', label: 'Saved', icon: Bookmark },
];

function initials(name?: string | null) {
  if (!name) return 'LH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function LawyerTopbar({
  activeTab,
  user,
  onLogout,
  extraActions,
}: LawyerTopbarProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayName = useMemo(() => user?.name || user?.displayName || 'Legal Hub User', [user]);
  const displayEmail = user?.email || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#4C2F5E]/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/discussions"
            className="inline-flex items-center rounded-full border border-[#4C2F5E]/10 bg-[#F8F4FB] px-3 py-2 transition hover:bg-[#F3EDF8]"
          >
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={136}
              height={34}
              className="h-auto w-[112px]"
            />
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map(({ id, href, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <Link
                  key={id}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#F1EAF6] text-[#4C2F5E] border border-[#4C2F5E]/10'
                      : 'text-[#6B5C79] hover:bg-[#F7F3FA] hover:text-[#4C2F5E]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3" ref={dropdownRef}>
          {extraActions}

          {user ? (
            <>
              <button
                onClick={() => setIsDropdownOpen((current) => !current)}
                className="inline-flex items-center gap-3 rounded-full border border-[#4C2F5E]/10 bg-white px-2 py-2 text-left text-[#4C2F5E] transition hover:bg-[#FBF9FD]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C2F5E] text-sm font-semibold text-white">
                  {initials(displayName)}
                </div>
                <div className="hidden min-w-0 md:block">
                  <p className="truncate text-sm font-semibold text-[#4C2F5E]">{displayName}</p>
                  <p className="truncate text-xs text-[#7B6D8A]">{displayEmail || 'Verified legal member'}</p>
                </div>
              </button>

              {isDropdownOpen ? (
                <div className="absolute right-4 top-[76px] w-72 rounded-[20px] border border-[#4C2F5E]/10 bg-white p-2 md:right-6 lg:right-8">
                  <div className="rounded-[16px] bg-[#F6F1FA] p-4">
                    <p className="text-sm font-semibold text-[#4C2F5E]">{displayName}</p>
                    <p className="mt-1 text-xs text-[#7B6D8A]">{displayEmail || 'Private legal workspace'}</p>
                  </div>

                  <div className="mt-2 grid gap-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push('/profile');
                      }}
                      className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#5F506D] transition hover:bg-[#F7F3FA]"
                    >
                      <User className="h-4 w-4 text-[#7B6D8A]" />
                      Profile settings
                    </button>
                    <button
                      onClick={async () => {
                        setIsDropdownOpen(false);
                        if (onLogout) await onLogout();
                      }}
                      className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <Link
              href="/lawyerlogin"
              className="hidden rounded-full border border-[#4C2F5E]/15 bg-[#F6F1FA] px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F1EAF6] md:inline-flex"
            >
              Sign in
            </Link>
          )}

          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#4C2F5E]/10 bg-[#F8F4FB] text-[#4C2F5E] transition hover:bg-[#F3EDF8] lg:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-[#4C2F5E]/10 bg-white px-4 py-3 lg:hidden">
          <div className="grid gap-2">
            {navItems.map(({ id, href, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <Link
                  key={id}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#F1EAF6] text-[#4C2F5E]'
                      : 'text-[#6B5C79] hover:bg-[#F7F3FA]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
