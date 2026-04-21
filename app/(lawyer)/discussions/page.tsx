'use client';

import StartDiscussionModal from '@/app/components/StartDiscussionModal';
import DiscussionCard from '@/app/components/lawyer/discussions/discussioncard';
import NotificationBell from '@/app/components/lawyer/discussions/notificationbell';
import LawyerTopbar from '@/app/components/lawyer/lawyer-topbar';
import { BriefcaseBusiness, ChevronDown, MapPin, Medal, Search, ShieldCheck, Sparkles, TrendingUp, Trophy, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #4C2F5E 0%, #6F5484 100%)',
  'linear-gradient(135deg, #5C3A70 0%, #8D74A3 100%)',
  'linear-gradient(135deg, #432853 0%, #6F5484 100%)',
  'linear-gradient(135deg, #4C2F5E 0%, #8D74A3 100%)',
];

const SORT_OPTIONS = ['Latest Activity', 'Most Viewed', 'Most Liked', 'Oldest First'];
const SORT_MAP: Record<string, string> = {
  'Latest Activity': 'latest',
  'Most Viewed': 'popular',
  'Most Liked': 'trending',
  'Oldest First': 'latest',
};

interface DiscussionRow {
  id: string;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  status: string;
  score: number;
  reactionCount: number;
  answerCount: number;
  viewCount: number;
  isPinned: boolean;
  isAiSummaryReady: boolean;
  createdAt: string;
  author: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    profile: { isLawyer: boolean } | null;
    lawyerProfile: { verificationStatus: string } | null;
  };
  category: { name: string; colorHex: string | null };
  region: { name: string } | null;
  tags: { tag: { id: string; name: string } }[];
  // Reactions now always fetched with full data for persistence
  reactions?: { reactionType: string; emoji: string | null; userId: string; user?: { displayName: string | null } }[];
  bookmarks?: { id: string }[];
}

interface MetaOpt {
  id: string;
  name: string;
}

interface FeaturedDiscussion {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  kind: string;
  answerCount: number;
  reactionCount: number;
  viewCount: number;
  isAiSummaryReady: boolean;
  createdAt: string;
  gradient: string;
  categoryName: string;
  authorName: string;
  authorInitials: string;
  authorAvatarUrl: string | null;
  isVerified: boolean;
  regionName: string | null;
}

interface TopLawyer {
  id: string;
  name: string;
  avatarUrl: string | null;
  practiceArea: string;
  firmName: string | null;
  region: string | null;
  score: number;
  monthlyCount: number;
  isVerified: boolean;
}

interface TrendingTopic {
  id: string;
  name: string;
  slug: string;
  thisWeek: number;
  pctChange: number;
  trend: string;
  isPositive: boolean;
}

interface RegionalHotTopic {
  id: string;
  name: string;
  slug: string;
  type: string;
  discussionCount: number;
  topCategory: string;
}

interface SidebarData {
  topLawyers: TopLawyer[];
  trendingTopics: TrendingTopic[];
  regionalHotTopics: RegionalHotTopic[];
  featuredDiscussions: FeaturedDiscussion[];
  focusCategories?: {
    id: string;
    name: string;
    discussionCount: number;
  }[];
}

interface CurrentUser {
  id?: string;
  name?: string;
  displayName?: string;
  email?: string;
}

interface QuickFilterOption {
  key: string;
  label: string;
  kind: 'category' | 'search';
  value: string;
}


function buildEmojiStats(
  reactions: DiscussionRow['reactions']
): Record<string, { count: number; reactors: string[] }> {
  const stats: Record<string, { count: number; reactors: string[] }> = {};
  for (const r of reactions ?? []) {
    if (!r.emoji) continue;
    const existing = stats[r.emoji] ?? { count: 0, reactors: [] };
    existing.count++;
    existing.reactors.push(r.user?.displayName ?? 'Someone');
    stats[r.emoji] = existing;
  }
  return stats;
}

function initials(name: string | null | undefined) {
  if (!name) return 'LH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function FeaturedSkeleton() {
  return (
    <div className="rounded-[18px] border border-[#4C2F5E]/10 bg-white">
      <div className="h-20 animate-pulse rounded-t-[18px] bg-[#F1EAF6]" />
      <div className="space-y-3 p-4">
        <div className="h-3 rounded bg-[#F5F1F8]" />
        <div className="h-3 w-2/3 rounded bg-[#F5F1F8]" />
        <div className="h-3 w-1/2 rounded bg-[#F5F1F8]" />
      </div>
    </div>
  );
}

function LawyerSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-[#F1EAF6]" />
        <div className="space-y-2">
          <div className="h-3 w-24 animate-pulse rounded bg-[#F5F1F8]" />
          <div className="h-3 w-16 animate-pulse rounded bg-[#F5F1F8]" />
        </div>
      </div>
      <div className="h-3 w-12 animate-pulse rounded bg-[#F5F1F8]" />
    </div>
  );
}

function leaderboardAccent(index: number) {
  if (index === 0) return { badge: 'border-amber-200 bg-amber-50 text-amber-700', ring: 'ring-2 ring-amber-200/70', dot: '#D97706' };
  if (index === 1) return { badge: 'border-slate-200 bg-slate-50 text-slate-700', ring: 'ring-2 ring-slate-200/80', dot: '#64748B' };
  if (index === 2) return { badge: 'border-orange-200 bg-orange-50 text-orange-700', ring: 'ring-2 ring-orange-200/80', dot: '#C2410C' };
  return { badge: 'border-[#4C2F5E]/10 bg-white text-[#4C2F5E]', ring: '', dot: '#4C2F5E' };
}


function buildDynamicLawyers(
  topLawyers: TopLawyer[],
  currentUser: CurrentUser | null,
  discussions: DiscussionRow[]
): TopLawyer[] {
  if (!currentUser) return topLawyers;

  const authoredDiscussions = discussions.filter((discussion) => discussion.author.id === currentUser.id);
  const fallbackName =
    authoredDiscussions[0]?.author.displayName ??
    currentUser.displayName ??
    currentUser.name ??
    'You';
  const fallbackPracticeArea = authoredDiscussions[0]?.category.name ?? 'General Practice';
  const fallbackRegion = authoredDiscussions[0]?.region?.name ?? null;
  const fallbackScore = authoredDiscussions.reduce((sum, discussion) => sum + Math.max(0, discussion.score), 0);
  const fallbackMonthlyCount = authoredDiscussions.length;

  if (topLawyers.length === 0) {
    return [{
      id: currentUser.id ?? 'current-user',
      name: fallbackName,
      avatarUrl: authoredDiscussions[0]?.author.avatarUrl ?? null,
      practiceArea: fallbackPracticeArea,
      firmName: null,
      region: fallbackRegion,
      score: fallbackScore,
      monthlyCount: fallbackMonthlyCount,
      isVerified: false,
    }];
  }

  // If the current user isn't listed yet, append them at the bottom
  const alreadyListed = topLawyers.some((l) => l.id === currentUser.id);
  if (!alreadyListed) {
    return [
      ...topLawyers,
      {
        id: currentUser.id ?? 'current-user',
        name: fallbackName,
        avatarUrl: authoredDiscussions[0]?.author.avatarUrl ?? null,
        practiceArea: fallbackPracticeArea,
        firmName: null,
        region: fallbackRegion,
        score: fallbackScore,
        monthlyCount: fallbackMonthlyCount,
        isVerified: false,
      },
    ];
  }

  return topLawyers;
}

export default function LegalDiscussionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<MetaOpt[]>([]);
  const [regions, setRegions] = useState<MetaOpt[]>([]);

  const [sidebar, setSidebar] = useState<SidebarData | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('Latest Activity');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [aiSummarized, setAiSummarized] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          setIsReady(true);
        } else {
          router.replace('/lawyerlogin');
        }
      })
      .catch(() => router.replace('/lawyerlogin'));
  }, [router]);

  useEffect(() => {
    setSidebarLoading(true);
    fetch('/api/discussions/sidebar')
      .then((r) => r.json())
      .then((data) => setSidebar(data))
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/discussions/meta')
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
        setRegions(d.regions ?? []);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async (resetToPage1 = false) => {
    setLoading(true);
    const currentPage = resetToPage1 ? 1 : page;
    if (resetToPage1) setPage(1);

    const params = new URLSearchParams({
      page: String(currentPage),
      limit: '15',
      sort: SORT_MAP[selectedSort] ?? 'latest',
      // Always include reactions and bookmarks so scores/emojis are persistent
      includeReactions: 'true',
      includeBookmarks: 'true',
    });

    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedRegion) params.set('regionId', selectedRegion);
    if (aiSummarized) params.set('aiSummaryOnly', 'true');
    if (searchQuery.trim()) params.set('search', searchQuery.trim());

    try {
      const res = await fetch(`/api/discussions?${params}`);
      const data = await res.json();
      setDiscussions(data.data ?? []);
      setTotalPages(data.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [aiSummarized, page, searchQuery, selectedCategory, selectedRegion, selectedSort]);

  useEffect(() => {
    if (isReady) load(true);
  }, [aiSummarized, activeQuickFilter, isReady, load, selectedCategory, selectedRegion, selectedSort]);

  useEffect(() => {
    if (isReady && page > 1) load();
  }, [isReady, load, page]);

  useEffect(() => {
    if (!isReady) return;
    const t = setTimeout(() => load(true), 400);
    return () => clearTimeout(t);
  }, [isReady, load, searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false);
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/lawyerlogin');
  }

  const quickFilters = useMemo<QuickFilterOption[]>(() => {
    const filters: QuickFilterOption[] = [];
    const seen = new Set<string>();

    for (const category of sidebar?.focusCategories ?? []) {
      const key = `category:${category.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      filters.push({
        key,
        label: category.name,
        kind: 'category',
        value: category.id,
      });
      if (filters.length >= 5) return filters;
    }

    const tagCounts = new Map<string, number>();
    for (const discussion of discussions) {
      for (const tag of discussion.tags) {
        tagCounts.set(tag.tag.name, (tagCounts.get(tag.tag.name) ?? 0) + 1);
      }
    }

    for (const [tagName] of [...tagCounts.entries()].sort((left, right) => right[1] - left[1])) {
      const key = `search:${tagName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      filters.push({
        key,
        label: tagName,
        kind: 'search',
        value: tagName,
      });
      if (filters.length >= 5) break;
    }

    return filters;
  }, [discussions, sidebar?.focusCategories]);

  const applyQuickFilter = (filter: QuickFilterOption) => {
    const isActive = activeQuickFilter === filter.key;

    if (isActive) {
      setActiveQuickFilter(null);
      if (filter.kind === 'category' && selectedCategory === filter.value) setSelectedCategory('');
      if (filter.kind === 'search' && searchQuery === filter.value) setSearchQuery('');
      return;
    }

    setActiveQuickFilter(filter.key);
    if (filter.kind === 'category') {
      setSelectedCategory(filter.value);
      if (searchQuery) setSearchQuery('');
    } else {
      setSearchQuery(filter.value);
      if (selectedCategory) setSelectedCategory('');
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E3DBE9] border-t-[#4C2F5E]" />
      </div>
    );
  }

  const catLabel = categories.find((c) => c.id === selectedCategory)?.name ?? 'All Categories';
  const regionLabel = regions.find((r) => r.id === selectedRegion)?.name ?? 'All Regions';
  const featuredCards = sidebar?.featuredDiscussions ?? [];
  const rawTopLawyers = sidebar?.topLawyers ?? [];
  const topLawyers = buildDynamicLawyers(rawTopLawyers, user, discussions);
  const trendingTopics = sidebar?.trendingTopics ?? [];
  const regionalTopics = sidebar?.regionalHotTopics ?? [];
  const hasFilters = !!(activeQuickFilter || selectedCategory || selectedRegion || searchQuery || aiSummarized);
  const leaderboardLawyers = topLawyers.slice(0, showFullLeaderboard ? topLawyers.length : 5);
  const leaderboardLeader = leaderboardLawyers[0];
  const leaderboardFollowers = leaderboardLawyers.slice(1);
  const isLeaderCurrentUser = leaderboardLeader?.id === user?.id;

  const filterButtonClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-[14px] border px-4 py-2 text-sm transition ${
      active
        ? 'border-[#4C2F5E]/20 bg-[#F1EAF6] text-[#4C2F5E]'
        : 'border-[#4C2F5E]/10 bg-white text-[#6B5C79] hover:bg-[#F7F3FA]'
    }`;

  return (
    <div className="min-h-screen bg-[#F8F6FB]">
      <LawyerTopbar
        activeTab="discussions"
        user={user}
        onLogout={handleLogout}
        extraActions={<NotificationBell />}
      />

      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-6 lg:px-8">
        <section className="legal-panel px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="legal-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Legal community
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#2F1D3B] md:text-4xl">
                Legal Discussions
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#736683] md:text-base">
                Join the conversation with legal experts and community members across Pakistan
              </p>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="legal-button-primary">
              Start a discussion
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sidebarLoading
              ? [1, 2, 3, 4].map((i) => <FeaturedSkeleton key={i} />)
              : featuredCards.length > 0
                ? featuredCards.map((card, index) => (
                    <Link
                      key={card.id}
                      href={`/discussions/${card.slug}`}
                      className="overflow-hidden rounded-[18px] border border-[#4C2F5E]/10 bg-white transition hover:border-[#4C2F5E]/20"
                    >
                      <div className="p-4 text-white" style={{ background: FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length] }}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold">
                            {card.categoryName}
                          </span>
                          {card.regionName ? (
                            <span className="text-[11px] font-medium text-white/80">{card.regionName}</span>
                          ) : null}
                        </div>
                        <h3 className="mt-8 line-clamp-2 text-sm font-semibold leading-6">{card.title}</h3>
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-center gap-3">
                          {card.authorAvatarUrl ? (
                            <img src={card.authorAvatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-[#4C2F5E]/10" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4C2F5E] text-[11px] font-semibold text-white">
                              {card.authorInitials || initials(card.authorName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[#4C2F5E]">{card.authorName}</p>
                            <p className="text-[12px] text-[#8B7D99]">{card.answerCount} answers</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                : [1, 2, 3, 4].map((i) => (
                    <div key={i} className="overflow-hidden rounded-[18px] border border-[#4C2F5E]/10 bg-white">
                      <div className="h-20" style={{ background: FALLBACK_GRADIENTS[i - 1] }} />
                      <div className="p-4 text-sm text-[#736683]">No featured discussions yet.</div>
                    </div>
                  ))}
          </div>

          {/* ── Search + filters ── */}
          <div className="mt-8 rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4 md:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7D99]" />
                  <input
                    type="text"
                    placeholder="Search legal topics, regions, or keywords"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-[16px] border border-[#4C2F5E]/12 bg-white pl-11 pr-12 text-sm text-[#2F1D3B] shadow-[0_10px_24px_rgba(76,47,94,0.06)] outline-none transition placeholder:text-[#A395AF] focus:border-[#4C2F5E]/25 focus:bg-[#FFFEFF]"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8B7D99] transition hover:bg-[#F3EDF8] hover:text-[#4C2F5E]"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <button onClick={() => setIsModalOpen(true)} className="legal-button-primary">
                  Start discussion
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => { setSortOpen(!sortOpen); setCategoryOpen(false); setRegionOpen(false); }}
                    className={filterButtonClass(sortOpen)}
                  >
                    {selectedSort}
                    <ChevronDown className={`h-4 w-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen ? (
                    <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-[16px] border border-[#4C2F5E]/10 bg-white p-2">
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => { setSelectedSort(opt); setSortOpen(false); }}
                          className={`w-full rounded-[12px] px-3 py-2 text-left text-sm transition ${
                            selectedSort === opt ? 'bg-[#F1EAF6] font-semibold text-[#4C2F5E]' : 'text-[#6B5C79] hover:bg-[#F7F3FA]'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={categoryRef}>
                  <button
                    onClick={() => { setCategoryOpen(!categoryOpen); setSortOpen(false); setRegionOpen(false); }}
                    className={filterButtonClass(categoryOpen || !!selectedCategory)}
                  >
                    {catLabel}
                    <ChevronDown className={`h-4 w-4 transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {categoryOpen ? (
                    <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-[16px] border border-[#4C2F5E]/10 bg-white p-2">
                      <button
                        onClick={() => { setSelectedCategory(''); setCategoryOpen(false); }}
                        className={`w-full rounded-[12px] px-3 py-2 text-left text-sm transition ${!selectedCategory ? 'bg-[#F1EAF6] font-semibold text-[#4C2F5E]' : 'text-[#6B5C79] hover:bg-[#F7F3FA]'}`}
                      >
                        All Categories
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCategory(c.id); setCategoryOpen(false); }}
                          className={`w-full rounded-[12px] px-3 py-2 text-left text-sm transition ${selectedCategory === c.id ? 'bg-[#F1EAF6] font-semibold text-[#4C2F5E]' : 'text-[#6B5C79] hover:bg-[#F7F3FA]'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative" ref={regionRef}>
                  <button
                    onClick={() => { setRegionOpen(!regionOpen); setSortOpen(false); setCategoryOpen(false); }}
                    className={filterButtonClass(regionOpen || !!selectedRegion)}
                  >
                    <MapPin className="h-4 w-4" />
                    {regionLabel}
                    <ChevronDown className={`h-4 w-4 transition-transform ${regionOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {regionOpen ? (
                    <div className="absolute left-0 top-full z-50 mt-2 max-h-72 w-52 overflow-y-auto rounded-[16px] border border-[#4C2F5E]/10 bg-white p-2">
                      <button
                        onClick={() => { setSelectedRegion(''); setRegionOpen(false); }}
                        className={`w-full rounded-[12px] px-3 py-2 text-left text-sm transition ${!selectedRegion ? 'bg-[#F1EAF6] font-semibold text-[#4C2F5E]' : 'text-[#6B5C79] hover:bg-[#F7F3FA]'}`}
                      >
                        All Regions
                      </button>
                      {regions.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => { setSelectedRegion(r.id); setRegionOpen(false); }}
                          className={`w-full rounded-[12px] px-3 py-2 text-left text-sm transition ${selectedRegion === r.id ? 'bg-[#F1EAF6] font-semibold text-[#4C2F5E]' : 'text-[#6B5C79] hover:bg-[#F7F3FA]'}`}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button onClick={() => setAiSummarized(!aiSummarized)} className={filterButtonClass(aiSummarized)}>
                  AI summarized only
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ── Main discussion list ── */}
          <main className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#4C2F5E]">Quick filters</span>
              {quickFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => applyQuickFilter(filter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    activeQuickFilter === filter.key
                      ? 'border-[#4C2F5E]/20 bg-[#F1EAF6] text-[#4C2F5E]'
                      : 'border-[#4C2F5E]/10 bg-white text-[#6B5C79] hover:bg-[#F7F3FA]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
              {quickFilters.length === 0 ? (
                <span className="rounded-full border border-dashed border-[#4C2F5E]/10 bg-white px-3 py-1.5 text-xs text-[#8B7D99]">
                  Filters will appear as discussion data comes in
                </span>
              ) : null}
              {hasFilters ? (
                <button
                  onClick={() => { setActiveQuickFilter(null); setSelectedCategory(''); setSelectedRegion(''); setSearchQuery(''); setAiSummarized(false); }}
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              ) : null}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-[20px] border border-[#4C2F5E]/10 bg-white" />
                ))}
              </div>
            ) : discussions.length === 0 ? (
              <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-white px-6 py-12 text-center">
                <p className="text-sm text-[#736683]">No discussions match the current filters.</p>
                <button
                  onClick={() => { setSelectedCategory(''); setSelectedRegion(''); setAiSummarized(false); setActiveQuickFilter(null); setSearchQuery(''); }}
                  className="mt-4 text-sm font-semibold text-[#4C2F5E]"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {discussions.map((d) => (
                  <DiscussionCard
                    key={d.id}
                    id={d.id}
                    slug={d.slug}
                    kind={d.kind}
                    title={d.title}
                    excerpt={d.excerpt}
                    status={d.status}
                    score={d.score}
                    reactionCount={d.reactionCount}
                    answerCount={d.answerCount}
                    viewCount={d.viewCount}
                    isPinned={d.isPinned}
                    isAiSummaryReady={d.isAiSummaryReady}
                    createdAt={d.createdAt}
                    author={d.author}
                    category={d.category}
                    region={d.region}
                    tags={d.tags}
                    isSaved={!!d.bookmarks?.length}
                    isLoggedIn={!!user}
                    initialEmojiStats={buildEmojiStats(d.reactions)}
                    userReaction={(() => {
                      const currentReaction = d.reactions?.find((reaction) => reaction.userId === user?.id);
                      return currentReaction
                        ? {
                            reactionType: currentReaction.reactionType,
                            emoji: currentReaction.emoji,
                          }
                        : null;
                    })()}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-[14px] border border-[#4C2F5E]/10 bg-white px-4 py-2 text-sm text-[#6B5C79] transition hover:bg-[#F7F3FA] disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-10 w-10 rounded-[14px] border text-sm font-semibold transition ${
                      page === p
                        ? 'border-[#4C2F5E] bg-[#4C2F5E] text-white'
                        : 'border-[#4C2F5E]/10 bg-white text-[#6B5C79] hover:bg-[#F7F3FA]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-[14px] border border-[#4C2F5E]/10 bg-white px-4 py-2 text-sm text-[#6B5C79] transition hover:bg-[#F7F3FA] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </main>

          {/* ── Sidebar ── */}
          <aside className="space-y-4">
            {/* ── Top lawyers – dynamic (always shows current user) ── */}
            <div className="legal-soft-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#4C2F5E]" />
                <h3 className="text-base font-semibold text-[#2F1D3B]">Top lawyers this month</h3>
              </div>
              <p className="mb-4 text-xs leading-6 text-[#8B7D99]">
                Ranked from verified contribution activity, accepted answers, and overall impact score.
              </p>

              {sidebarLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => <LawyerSkeleton key={i} />)}
                </div>
              ) : topLawyers.length === 0 ? (
                <p className="text-sm text-[#736683]">No activity data yet this month.</p>
              ) : (
                <div className="space-y-4">
                  {leaderboardLeader ? (
                    <div className="overflow-hidden rounded-[20px] border border-[#4C2F5E]/10 bg-[linear-gradient(135deg,#4C2F5E_0%,#7B58A0_100%)] text-white shadow-[0_18px_32px_rgba(76,47,94,0.18)]">
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                          <Medal className="h-3.5 w-3.5" />
                          {isLeaderCurrentUser ? 'Your position' : 'Leader this month'}
                        </div>
                        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold">
                          #1
                        </div>
                      </div>

                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-3">
                          {leaderboardLeader.avatarUrl ? (
                            <img
                              src={leaderboardLeader.avatarUrl}
                              alt={leaderboardLeader.name}
                              className="h-14 w-14 rounded-full border border-white/20 object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-white">
                              {initials(leaderboardLeader.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-base font-semibold">
                                {leaderboardLeader.name}
                                {isLeaderCurrentUser ? ' (You)' : ''}
                              </p>
                              {leaderboardLeader.isVerified ? (
                                <span className="rounded-full bg-white/14 px-2 py-0.5 text-[10px] font-semibold text-white">
                                  Verified
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-sm text-white/80">{leaderboardLeader.practiceArea}</p>
                            <p className="truncate text-xs text-white/65">
                              {leaderboardLeader.firmName || leaderboardLeader.region || 'Nationwide practice'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-[16px] border border-white/10 bg-white/8 px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">Impact score</p>
                            <p className="mt-1 text-lg font-semibold text-white">
                              {leaderboardLeader.score > 0 ? leaderboardLeader.score.toLocaleString() : '—'}
                            </p>
                          </div>
                          <div className="rounded-[16px] border border-white/10 bg-white/8 px-3 py-2.5">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-white/60">Monthly activity</p>
                            <p className="mt-1 text-lg font-semibold text-white">
                              {leaderboardLeader.monthlyCount > 0 ? leaderboardLeader.monthlyCount : '—'}
                            </p>
                          </div>
                        </div>

                        {isLeaderCurrentUser && leaderboardLeader.score === 0 && (
                          <p className="mt-3 text-[11px] text-white/60">
                            Start contributing to earn your impact score.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {leaderboardFollowers.map((lawyer, index) => {
                      const rank = index + 2;
                      const accent = leaderboardAccent(rank - 1);
                      const isCurrentUser = lawyer.id === user?.id;

                      return (
                        <div
                          key={lawyer.id}
                          className={`flex items-center justify-between gap-3 rounded-[18px] border px-3.5 py-3 transition ${
                            isCurrentUser
                              ? 'border-[#4C2F5E]/20 bg-[#F7F3FA]'
                              : 'border-[#4C2F5E]/8 bg-white hover:border-[#4C2F5E]/14 hover:bg-[#FCFAFE]'
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border text-[11px] font-semibold ${accent.badge}`}>
                              #{rank}
                            </div>
                            <div className={`relative ${accent.ring}`}>
                              {lawyer.avatarUrl ? (
                                <img
                                  src={lawyer.avatarUrl}
                                  alt={lawyer.name}
                                  className="h-11 w-11 rounded-full border border-[#4C2F5E]/10 object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#4C2F5E] text-xs font-semibold text-white">
                                  {initials(lawyer.name)}
                                </div>
                              )}
                              <span
                                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
                                style={{ backgroundColor: accent.dot }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[#4C2F5E]">
                                  {lawyer.name}
                                  {isCurrentUser ? ' (You)' : ''}
                                </p>
                                {lawyer.isVerified ? <ShieldCheck className="h-3.5 w-3.5 text-[#4C2F5E]" /> : null}
                              </div>
                              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8B7D99]">
                                <span className="inline-flex items-center gap-1">
                                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                                  {lawyer.practiceArea}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {lawyer.region || 'Nationwide'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#4C2F5E]">
                              {lawyer.score > 0 ? lawyer.score.toLocaleString() : '—'}
                            </p>
                            <p className="text-[11px] text-[#8B7D99]">{lawyer.monthlyCount} activities</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {topLawyers.length > 5 ? (
                <button
                  onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                  className="mt-4 text-sm font-semibold text-[#4C2F5E]"
                >
                  {showFullLeaderboard ? 'Show less' : 'View full leaderboard'}
                </button>
              ) : null}
            </div>

            {/* ── Trending topics ── */}
            <div className="legal-soft-panel p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#4C2F5E]" />
                <h3 className="text-base font-semibold text-[#2F1D3B]">Trending this week</h3>
              </div>

              {sidebarLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-[14px] bg-[#F5F1F8]" />
                  ))}
                </div>
              ) : trendingTopics.length === 0 ? (
                <p className="text-sm text-[#736683]">No trending topics yet.</p>
              ) : (
                <div className="space-y-3">
                  {trendingTopics.map((topic, index) => (
                    <div
                      key={topic.id}
                      className={`rounded-[16px] border px-4 py-3 ${index === 0 ? 'border-[#4C2F5E]/15 bg-[#F7F3FA]' : 'border-[#4C2F5E]/8 bg-white'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold text-[#4C2F5E]">
                          {index + 1}. {topic.name}
                        </p>
                        <span className={`text-xs font-semibold ${topic.isPositive ? 'text-[#4C2F5E]' : 'text-red-500'}`}>
                          {topic.trend}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#8B7D99]">
                        {topic.thisWeek} post{topic.thisWeek !== 1 ? 's' : ''} this week
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-[#4C2F5E]/8 pt-5">
                <h4 className="text-sm font-semibold text-[#2F1D3B]">Regional hot topics</h4>
                {sidebarLoading ? (
                  <div className="mt-3 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 animate-pulse rounded-[14px] bg-[#F5F1F8]" />
                    ))}
                  </div>
                ) : regionalTopics.length === 0 ? (
                  <p className="mt-3 text-sm text-[#736683]">No regional activity yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {regionalTopics.map((topic) => (
                      <div key={topic.id} className="rounded-[16px] border border-[#4C2F5E]/8 bg-white px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#4C2F5E]">
                          <MapPin className="h-4 w-4" />
                          {topic.name}
                        </div>
                        <p className="mt-1 text-xs text-[#8B7D99]">
                          {topic.discussionCount} discussions in {topic.topCategory}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── CTA ── */}
            <div className="rounded-[24px] border border-[#4C2F5E]/10 bg-[#4C2F5E] p-5 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Need legal input?
              </div>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Start a discussion and invite verified lawyers into the conversation.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-5 rounded-[14px] bg-white px-4 py-2.5 text-sm font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA]"
              >
                Ask a question
              </button>
            </div>
          </aside>
        </div>
      </div>

      <StartDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
