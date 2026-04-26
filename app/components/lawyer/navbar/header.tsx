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

const SEARCH_DATA = [
  { id: 1,  label: 'Ali Hassan',       subLabel: 'ali@example.com',      type: 'User',      href: '/admin/users'        },
  { id: 2,  label: 'Fatima Khan',      subLabel: 'fatima@example.com',     type: 'User',      href: '/admin/users'        },
  { id: 3,  label: 'Mohsin Khan',      subLabel: 'mohsin@example.com',     type: 'User',      href: '/admin/users'        },
  { id: 4,  label: 'Sana Mirza',       subLabel: 'sana@example.com',       type: 'User',      href: '/admin/users'        },
  { id: 5,  label: 'Bilal Akhtar',     subLabel: 'bilal@example.com',      type: 'User',      href: '/admin/users'        },
  { id: 6,  label: 'Zara Hussain',     subLabel: 'zara@example.com',       type: 'User',      href: '/admin/users'        },
  { id: 7,  label: 'Omar Farooq',      subLabel: 'omar@example.com',       type: 'User',      href: '/admin/users'        },
  { id: 8,  label: 'Nida Malik',       subLabel: 'nida@example.com',       type: 'User',      href: '/admin/users'        },
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

export default function Header({ userData: _userData }: HeaderProps) {
  const { isOpen, isMobile, toggle } = useSidebar();
  const router = useRouter();
  void _userData;

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showMobileSearch, setMobSearch] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery.trim().length > 0
    ? SEARCH_DATA.filter(
        item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const leftOffset = isMobile ? '0px' : (isOpen ? '256px' : '72px');

  const searchResultsDropdown = showResults && searchQuery.trim().length > 0 ? (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
      {searchResults.length > 0 ? (
        <>
          <div className="divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
            {searchResults.map(item => (
              <button
                key={item.id}
                onClick={() => handleResultClick(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition text-left cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 group-hover:text-[#4C2F5E] truncate">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{item.subLabel}</p>
                </div>
                <span className={`flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {item.type}
                </span>
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''} Found
            </p>
          </div>
        </>
      ) : (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-400 italic">No results found</p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <header
      className="fixed top-0 right-0 z-30 bg-[#F3F0F4] transition-all duration-300 w-full"
      style={{ left: leftOffset, width: `calc(100% - ${leftOffset})` }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        
        <div className="flex items-center flex-1 min-w-0 gap-3 sm:gap-4">
          <Tooltip content="Toggle sidebar">
            <button
              onClick={toggle}
              className="flex-shrink-0 p-2 text-gray-600 hover:text-[#4C2F5E] hover:bg-white rounded-lg transition-all cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <List size={24} />
            </button>
          </Tooltip>

          <div className="relative hidden sm:block w-full max-w-xs lg:max-w-md" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              placeholder="Search Admin Logs / User Records"
              className="block w-full pl-11 pr-9 py-2.5 bg-white border-none rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9F63C4]/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <Tooltip content="Clear search">
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
            {searchResultsDropdown}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Tooltip content={showMobileSearch ? 'Close search' : 'Open search'}>
            <button
              className="sm:hidden p-2.5 rounded-xl bg-white text-gray-500 shadow-sm cursor-pointer"
              onClick={() => setMobSearch(v => !v)}
              aria-label={showMobileSearch ? 'Close search' : 'Open search'}
            >
              {showMobileSearch ? <X size={20} /> : <Search size={20} />}
            </button>
          </Tooltip>
        </div>
      </div>

      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 bg-white border-b border-gray-100 ${
          showMobileSearch ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-3" ref={mobileSearchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              placeholder="Search Admin Logs / User Records"
              className="block w-full pl-11 pr-9 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9F63C4]/20"
              autoFocus={showMobileSearch}
            />
            {searchQuery && (
              <Tooltip content="Clear search">
                <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
            {searchResultsDropdown}
          </div>
        </div>
      </div>
    </header>
  );
}
