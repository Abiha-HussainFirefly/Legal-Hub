'use client';

import Image from 'next/image';
import AnimatedLink, { navigateWithTransition } from '@/app/components/ui/animated-link';
import Tooltip from '@/app/components/ui/tooltip';
import { Bookmark, BriefcaseBusiness, LayoutGrid, LogOut, Menu, MessageSquareText, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type ActiveTab = 'discussions' | 'cases' | 'topics' | 'saved' | 'profile';

interface LawyerTopbarProps {
  activeTab: ActiveTab;
  user?: {
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  onLogout?: () => Promise<void> | void;
  extraActions?: React.ReactNode;
}

const navItems: Array<{
  id: ActiveTab;
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'discussions', href: '/discussions', label: 'Discussions', shortLabel: 'Ask & answer', icon: MessageSquareText },
  { id: 'cases', href: '/cases', label: 'Cases', shortLabel: 'Case library', icon: BriefcaseBusiness },
  { id: 'topics', href: '/topics', label: 'My Topics', shortLabel: 'My activity', icon: LayoutGrid },
  { id: 'saved', href: '/saved', label: 'Saved', shortLabel: 'Bookmarks', icon: Bookmark },
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

  const displayName = useMemo(() => user?.displayName || user?.name || 'Legal Hub member', [user]);
  const displayEmail = user?.email || 'Public legal workspace';

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
    <header className="sticky top-0 z-40 border-b border-[#162033]/8 bg-[rgba(255,255,255,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 py-3 md:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AnimatedLink
            href="/discussions"
            className="inline-flex shrink-0 items-center rounded-full border border-[#4C2F5E]/10 bg-[#F8F4FB] px-3 py-2 transition hover:bg-white"
          >
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={136}
              height={34}
              className="h-auto w-[110px]"
            />
          </AnimatedLink>

          <nav className="hidden items-center gap-2 xl:flex">
            {navItems.map(({ id, href, label, shortLabel, icon: Icon }) => {
              const isActive = activeTab === id;

              return (
                <AnimatedLink
                  key={id}
                  href={href}
                  className={`inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-sm transition ${
                    isActive
                      ? 'border-[#4C2F5E]/14 bg-[#F1EAF6] text-[#4C2F5E]'
                      : 'border-transparent text-[#6B5C79] hover:border-[#4C2F5E]/8 hover:bg-[#F7F3FA] hover:text-[#4C2F5E]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">{label}</span>
                  <span className="hidden text-xs text-[#8B7D99] 2xl:inline">{shortLabel}</span>
                </AnimatedLink>
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
                className="inline-flex max-w-[220px] shrink-0 items-center gap-3 rounded-full border border-[#4C2F5E]/10 bg-white px-2 py-2 text-left transition hover:bg-[#FBF9FD] xl:max-w-[260px]"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#4C2F5E] text-sm font-semibold text-white">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(displayName)
                  )}
                </div>
                <div className="hidden min-w-0 md:block">
                  <p className="truncate text-sm font-semibold text-[#2F1D3B]">{displayName}</p>
                  <p className="truncate text-xs text-[#8B7D99]">{displayEmail}</p>
                </div>
              </button>

              {isDropdownOpen ? (
                <div className="absolute right-4 top-[68px] w-72 rounded-[18px] border border-[#4C2F5E]/10 bg-white p-2 shadow-[0_18px_36px_rgba(76,47,94,0.08)] md:right-6 lg:right-8 lh-form-enter">
                  <div className="flex items-center gap-3 rounded-[14px] bg-[#F6F1FA] p-4">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#4C2F5E] text-sm font-semibold text-white">
                      {user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials(displayName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#2F1D3B]">{displayName}</p>
                      <p className="mt-1 truncate text-xs text-[#8B7D99]">{displayEmail}</p>
                    </div>
                  </div>

                  <div className="mt-2 grid gap-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigateWithTransition(router, '/profile');
                      }}
                      className="inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#5F506D] transition hover:bg-[#F7F3FA]"
                    >
                      <User className="h-4 w-4 text-[#8B7D99]" />
                      My profile
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
            <AnimatedLink
              href="/lawyerlogin"
              className="hidden rounded-full border border-[#4C2F5E]/12 bg-[#F1EAF6] px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-white md:inline-flex"
            >
              Sign in
            </AnimatedLink>
          )}

          <Tooltip content={isMenuOpen ? 'Close menu' : 'Open menu'}>
            <button
              onClick={() => setIsMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#4C2F5E]/10 bg-[#F8F4FB] text-[#4C2F5E] transition hover:bg-white xl:hidden"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </Tooltip>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-[#162033]/8 bg-white px-4 py-3 xl:hidden">
          <div className="grid gap-2">
            {navItems.map(({ id, href, label, shortLabel, icon: Icon }) => {
              const isActive = activeTab === id;

              return (
                <AnimatedLink
                  key={id}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`inline-flex items-center gap-3 rounded-[16px] border px-4 py-3 text-sm transition ${
                    isActive
                      ? 'border-[#4C2F5E]/14 bg-[#F1EAF6] text-[#4C2F5E]'
                      : 'border-transparent text-[#6B5C79] hover:border-[#4C2F5E]/8 hover:bg-[#F7F3FA]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-[#8B7D99]">{shortLabel}</p>
                  </div>
                </AnimatedLink>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
