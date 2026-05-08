'use client';

import { useSidebar } from '@/app/components/admin/sidebar/SidebarContext';
import Tooltip from '@/app/components/ui/tooltip';
import { List, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface HeaderProps {
  userData?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    roles?: string[];
    displayName?: string;
    role?: string;
  } | null;
}

interface AdminSearchResult {
  id: string;
  label: string;
  subLabel: string;
  type: 'User' | 'Case' | 'Discussion' | 'Verification' | 'Report' | 'AI Alert';
  href: string;
}

const TYPE_COLORS: Record<AdminSearchResult['type'], string> = {
  User: 'bg-[#EBDEF0] text-[#4C2F5E]',
  Verification: 'bg-purple-100 text-purple-700',
  Case: 'bg-blue-50 text-blue-600',
  Discussion: 'bg-emerald-50 text-emerald-700',
  Report: 'bg-orange-50 text-orange-600',
  'AI Alert': 'bg-rose-50 text-rose-700',
};

export default function Header({ userData: _userData }: HeaderProps) {
  const { isOpen, isMobile, toggle } = useSidebar();
  const router = useRouter();
  void _userData;

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showMobileSearch, setMobSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<AdminSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleResultClick = (href: string) => {
    router.push(href);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setMobSearch(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}&limit=8`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          setSearchResults([]);
          return;
        }

        const payload = await response.json();
        setSearchResults(Array.isArray(payload.results) ? payload.results : []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load admin search results', error);
        }
      } finally {
        setSearchLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const leftOffset = isMobile ? '0px' : isOpen ? '256px' : '72px';

  const searchResultsDropdown = showResults && searchQuery.trim().length > 0 ? (
    <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      {searchLoading ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm italic text-gray-400">Searching live records...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          <div className="max-h-[350px] divide-y divide-gray-50 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => handleResultClick(item.href)}
                className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-purple-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800 group-hover:text-[#4C2F5E]">{item.label}</p>
                  <p className="truncate text-[11px] text-gray-400">{item.subLabel}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    TYPE_COLORS[item.type]
                  }`}
                >
                  {item.type}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''} Found
            </p>
          </div>
        </>
      ) : (
        <div className="px-4 py-8 text-center">
          <p className="text-sm italic text-gray-400">No live records found</p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <header
      className="fixed right-0 top-0 z-30 w-full bg-[#F3F0F4] transition-all duration-300"
      style={{ left: leftOffset, width: `calc(100% - ${leftOffset})` }}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <button
            onClick={toggle}
            className="flex-shrink-0 cursor-pointer rounded-lg p-2 text-gray-600 transition-all hover:bg-white hover:text-[#4C2F5E]"
            aria-label="Toggle sidebar"
          >
            <List size={24} />
          </button>

          <div className="relative hidden w-full max-w-xs sm:block lg:max-w-md" ref={searchRef}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              placeholder="Search users, cases, discussions, verification, reports"
              className="block w-full rounded-xl border-none bg-white py-2.5 pl-11 pr-9 text-sm placeholder-gray-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#9F63C4]/20"
            />
            {searchQuery ? (
              <Tooltip content="Clear search">
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              </Tooltip>
            ) : null}
            {searchResultsDropdown}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
          <Tooltip content={showMobileSearch ? 'Close search' : 'Open search'}>
            <button
              className="cursor-pointer rounded-xl bg-white p-2.5 text-gray-500 shadow-sm sm:hidden"
              onClick={() => setMobSearch((v) => !v)}
              aria-label={showMobileSearch ? 'Close search' : 'Open search'}
            >
              {showMobileSearch ? <X size={20} /> : <Search size={20} />}
            </button>
          </Tooltip>
        </div>
      </div>

      <div
        className={`overflow-hidden border-b border-gray-100 bg-white transition-all duration-300 sm:hidden ${
          showMobileSearch ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3" ref={mobileSearchRef}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              placeholder="Search users, cases, discussions, verification, reports"
              className="block w-full rounded-xl border-none bg-gray-50 py-2.5 pl-11 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#9F63C4]/20"
              autoFocus={showMobileSearch}
            />
            {searchQuery ? (
              <Tooltip content="Clear search">
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              </Tooltip>
            ) : null}
            {searchResultsDropdown}
          </div>
        </div>
      </div>
    </header>
  );
}
