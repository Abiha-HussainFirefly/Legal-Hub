'use client';

import StartDiscussionModal from '@/app/components/StartDiscussionModal';
import { ChevronDown, Eye, LogOut, Menu, Search, User, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const discussions = [
  {
    id: 1,
    title: 'Legal Framework for Digital Arrests in Pakistan - Need Clarification',
    excerpt: '43  I am trying to understand the legal status of cryptocurrency and NFTs under pakistani law.Recent amendments seem contradictory.. ',
    author: 'Muhammad Raza',
    category: 'Corporate Law',
    tags: ['Islamabad', 'AI Summary', 'Answered'],
    views: 31,
    likes: 132,
    timeAgo: '3 hours ago',
  },
  {
    id: 2,
    title: "Inheritance Rights: Father's Property Distribution Among Sons and Daughters",
    excerpt: '67  My father recently passed away without a will.According to Islamic law and Pakistani civil law,how should the property be distributed?',
    author: 'Ayesha Saleem',
    category: 'Family Law',
    tags: ['Lahore', 'AI Summary', 'Answered'],
    views: 23,
    likes: 45,
    timeAgo: '5 hours ago',
  },
  {
    id: 3,
    title: 'Employer Refusing to Pay Dues After Termination - Legal Options?',
    excerpt: '43  I was terminated from my job after 3 years without proper notice. The company is refusing to pay my pending salary and dues. What are my legal options under labor law?',
    author: 'Ali Khan',
    category: 'Labor Law',
    tags: ['Karachi', 'AI Summary', 'Answered'],
    views: 12,
    likes: 23,
    timeAgo: '1 day ago',
  },
  {
    id: 4,
    title: 'Property Dispute: Builder Not Delivering Possession as Per Agreement',
    excerpt: '43  Paid full amount for an apartment 2 years ago.Builder keeps delaying possession despite agreement. What legal action can I take?',
    author: 'Sarah Ahmed',
    category: 'Property Law',
    tags: ['Multan', 'AI Summary', 'Answered'],
    views: 8,
    likes: 14,
    timeAgo: '2 days ago',
  },
  {
    id: 5,
    title: 'Tax Notice from FBR: Understanding Section 114 Implications',
    excerpt: '43  Received a notice under Section 114 regarding tax year 2023. The demands seem excessive. Need guidance on response strategy...',
    author: 'Imran Shah',
    category: 'Corporate Law',
    tags: ['Islamabad', 'AI Summary', 'Answered'],
    views: 4,
    likes: 8,
    timeAgo: '3 days ago',
  },
  {
    id: 6,
    title: 'Defamation Case: Social Media Posts About Business - Legal Standing?',
    excerpt: '43  A competitor is posting false information about my business on social media. Can I file a defamation case? What evidence is required?',
    author: 'Bilal Khan',
    category: 'Corporate Law',
    tags: ['Islamabad', 'AI Summary', 'Answered'],
    views: 11,
    likes: 27,
    timeAgo: '4 days ago',
  },
];

const topLawyers = [
  { name: 'Adv. Nimra Khan',     cases: 'Criminal Law',  count: 2450 },
  { name: 'Adv. Shahid Khan',    cases: 'Contract Law',  count: 2180 },
  { name: 'Adv. Fatima Noor',    cases: 'Tax Law',       count: 1950 },
  { name: 'Adv. Hassan Raza',    cases: 'Labor Law',     count: 1820 },
  { name: 'Adv. Zainab Malik',   cases: 'Property Law',  count: 1650 },
  { name: 'Adv. Ahmed Siddiqui', cases: 'Family Law',    count: 1580 },
  { name: 'Adv. Sana Ahmed',     cases: 'Corporate Law', count: 1520 },
  { name: 'Adv. Omar Farooq',    cases: 'Cyber Law',     count: 1480 },
  { name: 'Adv. Aisha Rahman',   cases: 'Tax Law',       count: 1420 },
  { name: 'Adv. Bilal Mustafa',  cases: 'Property Law',  count: 1380 },
  { name: 'Adv. Mariam Khan',    cases: 'Labor Law',     count: 1350 },
  { name: 'Adv. Faisal Ali',     cases: 'Criminal Law',  count: 1320 },
  { name: 'Adv. Hina Butt',      cases: 'Family Law',    count: 1280 },
  { name: 'Adv. Saad Malik',     cases: 'Contract Law',  count: 1250 },
  { name: 'Adv. Nadia Shah',     cases: 'Corporate Law', count: 1220 },
  { name: 'Adv. Tariq Mehmood',  cases: 'Cyber Law',     count: 1190 },
  { name: 'Adv. Sara Khanum',    cases: 'Tax Law',       count: 1160 },
  { name: 'Adv. Usman Qureshi',  cases: 'Property Law',  count: 1130 },
  { name: 'Adv. Rabia Naheed',   cases: 'Labor Law',     count: 1100 },
  { name: 'Adv. Kamran Butt',    cases: 'Criminal Law',  count: 1070 },
];

const trendingTopics = [
  { name: 'Contract Law',      trend: '↑ +23%thisweek' },
  { name: 'Property Disputes', trend: '↑ +18%thisweek' },
  { name: 'Tax Fraud',         trend: '↑ +15%thisweek' },
  { name: 'Cybercrime',        trend: '↑ +12%thisweek' },
  { name: 'Labor Rights',      trend: '↑ +8%thisweek'  },
];

const registeredTopics = [
  { name: 'Family',   count: 'Property Law'      },
  { name: 'Criminal', count: 'Contract Disputes' },
  { name: 'Property', count: 'Tax Law'           },
];

const SORT_OPTIONS     = ['Latest Activity', 'Most Viewed', 'Most Liked', 'Oldest First'];
const CATEGORY_OPTIONS = ['All Categories', 'Corporate Law', 'Family Law', 'Labor Law', 'Property Law'];
const REGION_OPTIONS   = ['All Regions', 'Islamabad', 'Karachi', 'Lahore', 'Multan', 'Punjab'];
const QUICK_FILTERS    = ['Tax Fraud', 'Property Law', 'Cybercrime', 'Contract Disputes', 'Family Law'];

export default function LegalDiscussionsPage() {
  const router = useRouter();
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const sortRef      = useRef<HTMLDivElement>(null);
  const categoryRef  = useRef<HTMLDivElement>(null);
  const regionRef    = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [isReady,          setIsReady]         = useState(false);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [isUserMenuOpen,   setIsUserMenuOpen]   = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter states
  const [sortOpen,          setSortOpen]          = useState(false);
  const [categoryOpen,      setCategoryOpen]      = useState(false);
  const [regionOpen,        setRegionOpen]        = useState(false);
  const [selectedSort,      setSelectedSort]      = useState('Latest Activity');
  const [selectedCategory,  setSelectedCategory]  = useState('All Categories');
  const [selectedRegion,    setSelectedRegion]    = useState('All Regions');
  const [aiSummarized,      setAiSummarized]      = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res  = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setStatus('authenticated');
          setIsReady(true);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          setStatus('unauthenticated');
          router.replace('/lawyerlogin');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setStatus('unauthenticated');
        router.replace('/lawyerlogin');
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
        setIsUserMenuOpen(false);
      if (sortRef.current && !sortRef.current.contains(event.target as Node))
        setSortOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node))
        setCategoryOpen(false);
      if (regionRef.current && !regionRef.current.contains(event.target as Node))
        setRegionOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDiscussions = discussions
    .filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch   = !q || d.title.toLowerCase().includes(q) || d.excerpt.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All Categories' || d.category === selectedCategory;
      const matchesRegion   = selectedRegion   === 'All Regions'    || d.tags.includes(selectedRegion);
      const matchesAI       = !aiSummarized    || d.tags.includes('AI Summary');
      const matchesQuick    = !activeQuickFilter || d.category.toLowerCase().includes(activeQuickFilter.toLowerCase()) || d.title.toLowerCase().includes(activeQuickFilter.toLowerCase());
      return matchesSearch && matchesCategory && matchesRegion && matchesAI && matchesQuick;
    })
    .sort((a, b) => {
      if (selectedSort === 'Most Viewed')  return b.views - a.views;
      if (selectedSort === 'Most Liked')   return b.likes - a.likes;
      if (selectedSort === 'Oldest First') return b.id - a.id;
      return a.id - b.id;
    });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      router.replace('/lawyerlogin');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (status === 'loading' || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  const displayName  = user?.name  || user?.displayName || 'User';
  const displayEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <nav className="bg-[linear-gradient(135deg,#4C2F5E_0%,#9E63C4_100%)] text-white px-4 md:px-8 py-4">
        <div className="container mx-auto flex items-center justify-between gap-4">

          <div className="flex-shrink-0">
            <Image
              src="/logo-legal-hub.png"
              alt="Legal Hub"
              width={120}
              height={30}
              className="brightness-0 invert cursor-pointer"
              onClick={() => router.push('/discussions')}
              unoptimized
            />
          </div>

          <div className="hidden md:flex gap-6 lg:gap-8 text-sm font-medium">
            <Link href="/discussions" className="opacity-80 hover:opacity-100 transition">Discussions</Link>
            <Link href="/topics"      className="opacity-80 hover:opacity-100 transition">My Topics</Link>
            <Link href="/saved"       className="opacity-80 hover:opacity-100 transition">Saved</Link>
          </div>

          <div className="flex items-center gap-3">
            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="relative w-9 h-9 bg-transparent flex items-center justify-center transition-all active:scale-95 hover:opacity-80 outline-none border-none cursor-pointer"
              >
                <Image src="/icons/user.png" alt="User Profile" width={36} height={36} className="object-contain" priority unoptimized />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden text-gray-800 z-50">

                  {/* User info */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-transparent flex items-center justify-center">
                        <Image src="/icons/user.png" alt="User" width={35} height={35} unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#4C2F5E] truncate">{displayName}</p>
                        <p className="text-[10px] font-semibold text-[#9E63C4] tracking-wider lowercase truncate">{displayEmail}</p>
                        {/* Role badge — always LAWYER on this side */}
                        <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-purple-100 text-purple-700">
                          Lawyer
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    {/* View Profile */}
                    <button
                      onClick={() => {
                        router.push('/profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-[#4C2F5E] hover:bg-[#4C2F5E]/5 rounded-lg transition cursor-pointer"
                    >
                      <User size={14} /> View Profile
                    </button>

                    <div className="h-px bg-gray-100 my-1" />

                    {/* Sign out */}
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

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center text-white hover:opacity-80 transition"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-3 text-sm font-medium px-1 pb-2">
            <Link href="/discussions" className="opacity-80 hover:opacity-100 transition py-1" onClick={() => setIsMobileMenuOpen(false)}>Discussions</Link>
            <Link href="/topics"      className="opacity-80 hover:opacity-100 transition py-1" onClick={() => setIsMobileMenuOpen(false)}>My Topics</Link>
            <Link href="/saved"       className="opacity-80 hover:opacity-100 transition py-1" onClick={() => setIsMobileMenuOpen(false)}>Saved</Link>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <div className="bg-gray-50">
        <div className="w-full px-4 md:px-8 py-2">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#4C2F5E] to-[#9E62C4] bg-clip-text text-transparent mb-1">
            Legal Discussions
          </h1>
          <p className="text-sm text-[#6E7D7D] mb-5">Join the conversation with legal experts and community members across Pakistan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-24 bg-[linear-gradient(135deg,#63318C_0%,#EA496C_100%)] p-4 flex items-end">
                <span className="text-[10px] text-white border border-white/40 rounded-full px-3 py-0.5 bg-black/10">Criminal Law</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-800 leading-tight mb-3">Cybercrime Law Amendments 2025</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#9F63C4] text-[10px] flex items-center justify-center text-white font-bold">AN</div>
                    <span className="text-xs text-gray-500">Adv.Nimra Khan</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    <Image src="/icons/location.png" alt="Loc" width={10} height={10} className="shrink-0" unoptimized />
                    <span className="text-[10px] text-gray-600 font-medium">Punjab</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-24 bg-[linear-gradient(135deg,#3984F4_0%,#06B5D4_100%)] p-4 flex items-end">
                <span className="text-[10px] text-white border border-white/40 rounded-full px-3 py-0.5 bg-black/10">Contract Law</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-800 leading-tight mb-3">Digital Contract Validity in Pakistani Courts</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#9F63C4] text-[10px] flex items-center justify-center text-white font-bold">SK</div>
                    <span className="text-xs text-gray-500">Adv.Shahid khan</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    <Image src="/icons/location.png" alt="Loc" width={10} height={10} className="shrink-0" unoptimized />
                    <span className="text-[10px] text-gray-600 font-medium">Karachi</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-24 bg-[linear-gradient(135deg,#4C2F5E_0%,#9F63C4_100%)] p-4 flex items-end">
                <span className="text-[10px] text-white border border-white/40 rounded-full px-3 py-0.5 bg-black/10">Tax Law</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-800 leading-tight mb-3">Property Tax Reforms 2025: What You Need to...</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#9F63C4] text-[10px] flex items-center justify-center text-white font-bold">FN</div>
                    <span className="text-xs text-gray-500">Adv.Fatima Noor</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    <Image src="/icons/location.png" alt="Loc" width={10} height={10} className="shrink-0" unoptimized />
                    <span className="text-[10px] text-gray-600 font-medium">Islamabad</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-24 bg-[linear-gradient(135deg,#005C57_0%,#00C2B7_100%)] p-4 flex items-end">
                <span className="text-[10px] text-white border border-white/40 rounded-full px-3 py-0.5 bg-black/10">Labor Law</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-800 leading-tight mb-3">Labor Rights in Remote Work Arrangements</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#9F63C4] text-[10px] flex items-center justify-center text-white font-bold">HR</div>
                    <span className="text-xs text-gray-500">Adv.Hassan Raza</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    <Image src="/icons/location.png" alt="Loc" width={10} height={10} className="shrink-0" unoptimized />
                    <span className="text-[10px] text-gray-600 font-medium">Pakistan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search legal topics, keywords, or regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 md:pr-48 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden md:block absolute right-3 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-[linear-gradient(135deg,#4C2F5E_0%,#9F63C4_100%)] text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm cursor-pointer"
            >
              + Start Discussion
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="md:hidden w-full mb-4 py-2.5 bg-[linear-gradient(135deg,#4C2F5E_0%,#9F63C4_100%)] text-white rounded-lg font-medium text-sm cursor-pointer"
          >
            + Start Discussion
          </button>

          {/* Filters Row */}
          <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            <div className="relative flex-shrink-0" ref={sortRef}>
              <button
                onClick={() => { setSortOpen(!sortOpen); setCategoryOpen(false); setRegionOpen(false); }}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 border rounded-lg bg-white transition text-sm cursor-pointer whitespace-nowrap ${sortOpen ? 'border-purple-400 ring-1 ring-purple-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <Image src="/icons/settings.png" alt="Sort" width={16} height={16} className="shrink-0" unoptimized />
                <span className="text-gray-700">{selectedSort}</span>
                <ChevronDown className={`w-4 h-4 text-gray-600 ml-auto transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => { setSelectedSort(opt); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-purple-50 hover:text-[#4C2F5E] ${selectedSort === opt ? 'bg-[#F4EBF9] text-[#4C2F5E] font-semibold' : 'text-gray-700'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-shrink-0" ref={categoryRef}>
              <button
                onClick={() => { setCategoryOpen(!categoryOpen); setSortOpen(false); setRegionOpen(false); }}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 border rounded-lg bg-white transition text-sm cursor-pointer whitespace-nowrap ${categoryOpen ? 'border-purple-400 ring-1 ring-purple-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <span className={selectedCategory !== 'All Categories' ? 'text-[#4C2F5E] font-semibold' : 'text-gray-700'}>{selectedCategory}</span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {categoryOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => { setSelectedCategory(opt); setCategoryOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-purple-50 hover:text-[#4C2F5E] ${selectedCategory === opt ? 'bg-[#F4EBF9] text-[#4C2F5E] font-semibold' : 'text-gray-700'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-shrink-0" ref={regionRef}>
              <button
                onClick={() => { setRegionOpen(!regionOpen); setSortOpen(false); setCategoryOpen(false); }}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 border rounded-lg bg-white transition text-sm cursor-pointer whitespace-nowrap ${regionOpen ? 'border-purple-400 ring-1 ring-purple-300' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <Image src="/icons/location.png" alt="Loc" width={16} height={16} className="shrink-0" unoptimized />
                <span className={selectedRegion !== 'All Regions' ? 'text-[#4C2F5E] font-semibold' : 'text-gray-700'}>{selectedRegion}</span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${regionOpen ? 'rotate-180' : ''}`} />
              </button>
              {regionOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {REGION_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => { setSelectedRegion(opt); setRegionOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-purple-50 hover:text-[#4C2F5E] ${selectedRegion === opt ? 'bg-[#F4EBF9] text-[#4C2F5E] font-semibold' : 'text-gray-700'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setAiSummarized(!aiSummarized)}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 border rounded-lg transition text-sm cursor-pointer flex-shrink-0 whitespace-nowrap ${aiSummarized ? 'bg-[#9F63C4] border-[#9F63C4] text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${aiSummarized ? 'bg-white border-white' : 'border-gray-400'}`}>
                {aiSummarized && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9F63C4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              AI Summarized only
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="w-full px-4 md:px-8 py-0">
        <div className="flex items-center gap-4 py-4">
          <span className="text-xs font-bold text-gray-800 whitespace-nowrap">Quick Filters:</span>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {QUICK_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveQuickFilter(activeQuickFilter === filter ? null : filter)}
                className={`px-3 md:px-4 py-1.5 border rounded-full text-[12px] font-medium transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                  activeQuickFilter === filter
                    ? 'bg-[#9F63C4] border-[#9F63C4] text-white shadow-md'
                    : 'bg-transparent border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                {filter}
              </button>
            ))}
            {activeQuickFilter && (
              <button
                onClick={() => setActiveQuickFilter(null)}
                className="px-3 py-1.5 border border-red-200 text-red-400 rounded-full text-[12px] font-medium hover:bg-red-50 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          <main className="flex-1 min-w-0">
            <div className="space-y-3">
              {filteredDiscussions.length === 0 ? (
                <div className="bg-white rounded-lg p-10 border border-gray-100 shadow-sm text-center">
                  <p className="text-gray-400 text-sm font-medium">No discussions match your filters.</p>
                  <button
                    onClick={() => { setSelectedCategory('All Categories'); setSelectedRegion('All Regions'); setAiSummarized(false); setActiveQuickFilter(null); setSearchQuery(''); }}
                    className="mt-3 text-[#9F63C4] text-xs font-bold hover:opacity-70 transition cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredDiscussions.map((discussion) => (
                  <div key={discussion.id} className="bg-white rounded-lg p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-start gap-2 mb-2">
                      <Image
                        src="/icons/vector.png"
                        alt="Up"
                        width={18}
                        height={18}
                        className="mt-1 shrink-0 opacity-100"
                        style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' }}
                        unoptimized
                      />
                      <h3 className="font-semibold text-black leading-tight hover:text-[#4C2F5E] cursor-pointer text-[14px] md:text-[16px]">
                        {discussion.title}
                      </h3>
                    </div>
                    <p className="text-[#6E7D7D] text-sm mb-3 line-clamp-2">{discussion.excerpt}</p>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-gray-100 text-black rounded-full text-xs md:text-sm font-bold border border-gray-200">{discussion.category}</span>
                      {discussion.tags.map((tag) => {
                        if (['Islamabad','Karachi','Punjab','Lahore','Multan'].includes(tag)) {
                          return (
                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 border border-gray-200 text-gray-600 rounded-full text-xs md:text-sm bg-white">
                              <Image src="/icons/location.png" alt="Loc" width={10} height={10} className="shrink-0 opacity-70" unoptimized />
                              {tag}
                            </span>
                          );
                        }
                        if (tag === 'AI Summary') {
                          return (
                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-[#9F63C4] text-white rounded-full text-xs md:text-sm font-medium shadow-sm">
                              <Image src="/icons/ai.png" alt="AI" width={12} height={12} className="brightness-0 invert shrink-0" unoptimized />
                              {tag}
                            </span>
                          );
                        }
                        if (tag === 'Answered') {
                          return (
                            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 text-[#4C2F5E] text-xs md:text-sm font-medium">
                              <div className="w-3.5 h-3.5 border border-[#4C2F5E] rounded-full flex items-center justify-center shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" stroke="#4C2F5E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              {tag}
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <hr className="border-gray-100 mb-4" />
                    <div className="flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#9F63C4] rounded-full flex items-center justify-center text-white text-[10px] font-bold">{discussion.author.charAt(0)}</div>
                        <span className="text-xs md:text-sm text-gray-500 font-medium">{discussion.author}</span>
                      </div>
                      <div className="flex items-center gap-3 md:gap-4">
                        <span className="flex items-center gap-1"><Image src="/icons/message.png" alt="Mes" width={10} height={10} unoptimized />{discussion.likes}</span>
                        <span className="flex items-center gap-1 text-[#4C2F5E]"><Eye className="w-3 h-3" />{discussion.views}</span>
                        <span className="hidden sm:inline">{discussion.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-[380px] flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 w-[380px]">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/icons/vector.png" alt="icon" width={16} height={16} className="shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' }} unoptimized />
                <h3 className="text-[16px] font-bold text-[#4C2F5E]">Top Lawyers This Month</h3>
              </div>
              <div className="space-y-4">
                {topLawyers.slice(0, showFullLeaderboard ? topLawyers.length : 5).map((lawyer, index) => (
                  <div key={lawyer.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100">
                          <Image src={index % 2 === 0 ? "/icons/femalelawyer.png" : "/icons/malelawyer.png"} alt={lawyer.name} width={36} height={36} className="object-cover" unoptimized />
                        </div>
                        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#9E63C4] rounded-full flex items-center justify-center text-[8px] text-white font-bold border-[1.5px] border-white shadow-sm">{index + 1}</div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#4C2F5E] mb-0.5">{lawyer.name}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{lawyer.cases}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 px-2 py-0.5 border border-gray-100 rounded-full bg-white shadow-sm w-[75px] justify-center">
                        <Image src="/icons/location.png" alt="Loc" width={9} height={9} className="opacity-50" unoptimized />
                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tight">{index === 0 ? 'Punjab' : index === 1 ? 'Karachi' : 'Islamabad'}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-[#9E63C4] w-[40px] justify-end">
                        <Image src="/icons/path.png" alt="trend" width={12} height={12} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
                        <span className="text-[11px] font-bold">{lawyer.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                  className="text-[11px] font-bold text-[#9E63C4] hover:opacity-70 flex items-center justify-center gap-1 w-full transition-opacity cursor-pointer"
                >
                  {showFullLeaderboard ? 'Show Less Lawyers ' : 'View Full Leaderboard '}
                  <span className="text-xs">{showFullLeaderboard ? '↑' : '→'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4 w-[380px]">
              <div className="flex items-center gap-2 mb-6">
                <Image src="/icons/path.png" alt="icon" width={18} height={18} style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' }} unoptimized />
                <h3 className="text-[17px] font-bold text-[#4C2F5E]">Trending This Week</h3>
              </div>
              <div className="space-y-1 mb-8">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.name} className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${index === 0 ? 'bg-[#F4EBF9]' : ''}`}>
                    <span className="text-[#9E63C4] font-bold text-[15px] mt-0.5">{index + 1}</span>
                    <div className="flex-1">
                      <div className="text-[#4C2F5E] font-bold text-[14px] mb-0.5">{topic.name}</div>
                      <div className="flex items-center gap-1 text-[#9E63C4] text-[11px] font-semibold">
                        <Image src="/icons/path.png" alt="up" width={10} height={10} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
                        {topic.trend.replace('↑ ', '').replace('thisweek', ' this week')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="border-gray-100 mb-6" />
              <h3 className="text-[17px] font-bold text-[#4C2F5E] mb-5">Regional Hot Topics</h3>
              <div className="space-y-4">
                {registeredTopics.slice(0, 3).map((topic, index) => (
                  <div key={topic.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image src="/icons/location.png" alt="loc" width={12} height={12} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
                      <span className="text-[14px] text-[#6E7D7D] font-medium">{index === 0 ? 'Punjab' : index === 1 ? 'Karachi' : 'Islamabad'}</span>
                    </div>
                    <span className="px-4 py-1.5 border border-gray-200 rounded-full text-[11px] text-[#4C2F5E] font-semibold bg-white shadow-sm min-w-[110px] text-center">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile sidebar */}
        <div className="xl:hidden mt-6 space-y-4 pb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/icons/vector.png" alt="icon" width={16} height={16} className="shrink-0" style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' }} unoptimized />
              <h3 className="text-[16px] font-bold text-[#4C2F5E]">Top Lawyers This Month</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topLawyers.slice(0, showFullLeaderboard ? topLawyers.length : 5).map((lawyer, index) => (
                <div key={lawyer.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100">
                        <Image src={index % 2 === 0 ? "/icons/femalelawyer.png" : "/icons/malelawyer.png"} alt={lawyer.name} width={36} height={36} className="object-cover" unoptimized />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#9E63C4] rounded-full flex items-center justify-center text-[8px] text-white font-bold border-[1.5px] border-white shadow-sm">{index + 1}</div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#4C2F5E] mb-0.5">{lawyer.name}</span>
                      <span className="text-[11px] text-gray-400 font-medium">{lawyer.cases}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-[#9E63C4] shrink-0">
                    <Image src="/icons/path.png" alt="trend" width={12} height={12} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
                    <span className="text-[11px] font-bold">{lawyer.count}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                className="text-[11px] font-bold text-[#9E63C4] hover:opacity-70 flex items-center justify-center gap-1 w-full transition-opacity cursor-pointer"
              >
                {showFullLeaderboard ? 'Show Less Lawyers ' : 'View Full Leaderboard '}
                <span className="text-xs">{showFullLeaderboard ? '↑' : '→'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/icons/path.png" alt="icon" width={18} height={18} style={{ filter: 'brightness(0) saturate(100%) invert(20%) sepia(21%) saturate(1450%) hue-rotate(228deg) brightness(95%) contrast(92%)' }} unoptimized />
                <h3 className="text-[15px] font-bold text-[#4C2F5E]">Trending This Week</h3>
              </div>
              <div className="space-y-1">
                {trendingTopics.map((topic, index) => (
                  <div key={topic.name} className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${index === 0 ? 'bg-[#F4EBF9]' : ''}`}>
                    <span className="text-[#9E63C4] font-bold text-[14px] mt-0.5">{index + 1}</span>
                    <div className="flex-1">
                      <div className="text-[#4C2F5E] font-bold text-[13px] mb-0.5">{topic.name}</div>
                      <div className="flex items-center gap-1 text-[#9E63C4] text-[10px] font-semibold">
                        <Image src="/icons/path.png" alt="up" width={10} height={10} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
                        {topic.trend.replace('↑ ', '').replace('thisweek', ' this week')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-[15px] font-bold text-[#4C2F5E] mb-4">Regional Hot Topics</h3>
              <div className="space-y-4">
                {registeredTopics.slice(0, 3).map((topic, index) => (
                  <div key={topic.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image src="/icons/location.png" alt="loc" width={12} height={12} style={{ filter: 'invert(52%) sepia(35%) saturate(836%) hue-rotate(235deg) brightness(85%) contrast(89%)' }} unoptimized />
                      <span className="text-[13px] text-[#6E7D7D] font-medium">{index === 0 ? 'Punjab' : index === 1 ? 'Karachi' : 'Islamabad'}</span>
                    </div>
                    <span className="px-3 py-1.5 border border-gray-200 rounded-full text-[10px] text-[#4C2F5E] font-semibold bg-white shadow-sm text-center">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StartDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}