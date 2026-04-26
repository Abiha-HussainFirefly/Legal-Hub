'use client';

import StartDiscussionModal from '@/app/components/StartDiscussionModal';
import DiscussionCard from '@/app/components/lawyer/discussions/discussioncard';
import DiscussionsDiscoverySidebar from '@/app/components/lawyer/discussions/discussions-discovery-sidebar';
import DiscussionsFeedToolbar from '@/app/components/lawyer/discussions/discussions-feed-toolbar';
import DiscussionsFeaturedSection from '@/app/components/lawyer/discussions/discussions-featured-section';
import NotificationBell from '@/app/components/lawyer/discussions/notificationbell';
import LawyerTopbar from '@/app/components/lawyer/lawyer-topbar';
import { apiRequest, getErrorMessage } from '@/lib/api-client';
import { MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

const sortOptions = [
  { label: 'Latest activity', value: 'latest' },
  { label: 'Most viewed', value: 'popular' },
  { label: 'Most liked', value: 'trending' },
];

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
    profile: {
      username: string | null;
      isLawyer: boolean;
      headline?: string | null;
      primaryRegion?: { name: string } | null;
    } | null;
    lawyerProfile: {
      verificationStatus: string;
      barCouncil?: string | null;
      firmName?: string | null;
    } | null;
  };
  category: { name: string; colorHex: string | null };
  region: { name: string } | null;
  tags: { tag: { id: string; name: string } }[];
  reactions?: { reactionType: string; emoji: string | null; userId: string; user?: { displayName: string | null } }[];
  bookmarks?: { id: string }[];
}

interface MetaOption {
  id: string;
  name: string;
}

interface FeaturedDiscussion {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  kind?: string;
  answerCount: number;
  reactionCount?: number;
  viewCount: number;
  gradient?: string;
  isAiSummaryReady?: boolean;
  createdAt?: string;
  categoryName: string;
  regionName: string | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  authorUsername: string | null;
  authorHeadline: string | null;
  authorIsLawyer: boolean;
  authorRegionName: string | null;
  isVerified: boolean;
}

interface TopLawyer {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  headline: string | null;
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
  trend: string;
  thisWeek: number;
}

interface SidebarData {
  communityBrief?: {
    activeDiscussions: number;
    verifiedLawyers: number;
    activeRegions: number;
    aiSummaries: number;
  };
  topLawyers: TopLawyer[];
  trendingTopics: TrendingTopic[];
  featuredDiscussions: FeaturedDiscussion[];
  focusCategories?: Array<{
    id: string;
    name: string;
    discussionCount: number;
  }>;
}

interface DiscussionsResponse {
  data?: DiscussionRow[];
  meta?: {
    totalPages?: number;
  };
}

interface AuthResponse {
  authenticated: boolean;
  user?: CurrentUser;
}

interface MetaResponse {
  categories?: MetaOption[];
  regions?: MetaOption[];
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
  type: 'category' | 'search';
  value: string;
}

function buildEmojiStats(
  reactions: DiscussionRow['reactions'],
): Record<string, { count: number; reactors: string[] }> {
  const stats: Record<string, { count: number; reactors: string[] }> = {};

  for (const reaction of reactions ?? []) {
    if (!reaction.emoji) continue;

    const existing = stats[reaction.emoji] ?? { count: 0, reactors: [] };
    existing.count += 1;
    existing.reactors.push(reaction.user?.displayName ?? 'Someone');
    stats[reaction.emoji] = existing;
  }

  return stats;
}

export default function LegalDiscussionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [sidebar, setSidebar] = useState<SidebarData | null>(null);
  const [categories, setCategories] = useState<MetaOption[]>([]);
  const [regions, setRegions] = useState<MetaOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [pageError, setPageError] = useState('');

  const deferredSearch = useDeferredValue(searchQuery.trim());

  useEffect(() => {
    const controller = new AbortController();

    async function loadCurrentUser() {
      try {
        const data = await apiRequest<AuthResponse>('/api/auth/me', {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!data.authenticated) {
          router.replace('/lawyerlogin');
          return;
        }

        setUser(data.user ?? null);
        setIsReady(true);
      } catch {
        router.replace('/lawyerlogin');
      }
    }

    void loadCurrentUser();

    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();

    async function loadMeta() {
      setSidebarLoading(true);

      try {
        const [metaResponse, sidebarResponse] = await Promise.all([
          apiRequest<MetaResponse>('/api/discussions/meta', {
            signal: controller.signal,
            cache: 'no-store',
          }),
          apiRequest<SidebarData>('/api/discussions/sidebar', {
            signal: controller.signal,
            cache: 'no-store',
          }),
        ]);

        setCategories(metaResponse.categories ?? []);
        setRegions(metaResponse.regions ?? []);
        setSidebar(sidebarResponse);
      } catch {
        if (!controller.signal.aborted) {
          setSidebar(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSidebarLoading(false);
        }
      }
    }

    void loadMeta();

    return () => controller.abort();
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: '12',
      sort,
      includeReactions: 'true',
      includeBookmarks: 'true',
    });

    if (selectedCategory) params.set('categoryId', selectedCategory);
    if (selectedRegion) params.set('regionId', selectedRegion);
    if (deferredSearch) params.set('search', deferredSearch);

    async function loadDiscussions() {
      setLoading(true);
      setPageError('');

      try {
        const data = await apiRequest<DiscussionsResponse>(`/api/discussions?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        setDiscussions(data.data ?? []);
        setTotalPages(data.meta?.totalPages ?? 1);
      } catch (error) {
        if (!controller.signal.aborted) {
          setDiscussions([]);
          setTotalPages(1);
          setPageError(getErrorMessage(error, 'Unable to load discussions right now.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDiscussions();

    return () => controller.abort();
  }, [deferredSearch, isReady, page, selectedCategory, selectedRegion, sort]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, selectedCategory, selectedRegion, sort]);

  async function handleLogout() {
    await apiRequest('/api/auth/logout', { method: 'POST' });
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
        type: 'category',
        value: category.id,
      });

      if (filters.length >= 4) return filters;
    }

    for (const discussion of discussions) {
      for (const tag of discussion.tags) {
        const key = `search:${tag.tag.name}`;
        if (seen.has(key)) continue;

        seen.add(key);
        filters.push({
          key,
          label: tag.tag.name,
          type: 'search',
          value: tag.tag.name,
        });

        if (filters.length >= 4) return filters;
      }
    }

    return filters;
  }, [discussions, sidebar?.focusCategories]);

  function applyQuickFilter(filter: QuickFilterOption) {
    const isActive = activeQuickFilter === filter.key;

    if (isActive) {
      setActiveQuickFilter(null);
      if (filter.type === 'category') setSelectedCategory('');
      if (filter.type === 'search') setSearchQuery('');
      return;
    }

    setActiveQuickFilter(filter.key);

    if (filter.type === 'category') {
      setSelectedCategory(filter.value);
      setSearchQuery('');
    } else {
      setSearchQuery(filter.value);
      setSelectedCategory('');
    }
  }

  function clearFilters() {
    setActiveQuickFilter(null);
    setSelectedCategory('');
    setSelectedRegion('');
    setSearchQuery('');
    setSort('latest');
  }

  function clearSingleFilter(key: 'search' | 'sort' | 'category' | 'region') {
    setActiveQuickFilter(null);

    if (key === 'search') setSearchQuery('');
    if (key === 'sort') setSort('latest');
    if (key === 'category') setSelectedCategory('');
    if (key === 'region') setSelectedRegion('');
  }

  const featuredDiscussions = sidebar?.featuredDiscussions ?? [];
  const topLawyers = sidebar?.topLawyers ?? [];
  const trendingTopics = sidebar?.trendingTopics ?? [];
  const focusCategories = sidebar?.focusCategories ?? [];
  const communityBrief = sidebar?.communityBrief;
  const hasFilters = Boolean(activeQuickFilter || selectedCategory || selectedRegion || searchQuery || sort !== 'latest');
  const activeFilterChips = useMemo(
    () =>
      [
        searchQuery.trim() ? { key: 'search' as const, label: searchQuery.trim(), prefix: 'Search' } : null,
        sort !== 'latest'
          ? { key: 'sort' as const, label: sortOptions.find((option) => option.value === sort)?.label ?? sort, prefix: 'Sort' }
          : null,
        selectedCategory
          ? {
              key: 'category' as const,
              label: categories.find((category) => category.id === selectedCategory)?.name ?? selectedCategory,
              prefix: 'Category',
            }
          : null,
        selectedRegion
          ? {
              key: 'region' as const,
              label: regions.find((region) => region.id === selectedRegion)?.name ?? selectedRegion,
              prefix: 'Region',
            }
          : null,
      ].filter(Boolean) as Array<{ key: 'search' | 'sort' | 'category' | 'region'; label: string; prefix: string }>,
    [categories, regions, searchQuery, selectedCategory, selectedRegion, sort],
  );

  if (!isReady) {
    return (
      <div className="legal-workspace-shell flex items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#E3DBE9] border-t-[#4C2F5E]" />
      </div>
    );
  }

  return (
    <div className="legal-workspace-shell">
      <LawyerTopbar
        activeTab="discussions"
        user={user}
        onLogout={handleLogout}
        extraActions={<NotificationBell />}
      />

      <div className="mx-auto max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lh-page-enter">
        <section className="workspace-header p-5 md:p-6 lh-page-enter lh-delay-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="legal-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Community conversations
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#2F1D3B] md:text-[2.25rem]">Discussions</h1>
                <span className="rounded-full border border-[#2F1D3B]/10 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8B7D99]">
                  Public
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#736683] md:text-base">
                Browse featured conversations, filter by legal topic, and find the most helpful community voices in a layout that is easier to scan.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <div className="workspace-pill border-[#2F1D3B]/8 bg-white text-[#736683]">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  {communityBrief?.activeDiscussions ?? discussions.length} active discussions
                </div>
                <div className="workspace-pill border-[#2F1D3B]/8 bg-white text-[#736683]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {communityBrief?.verifiedLawyers ?? topLawyers.length} trusted voices
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="legal-button-primary text-sm">
                Start discussion
              </button>
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#736683]">
          <span className="workspace-pill border-[#2F1D3B]/8 bg-white text-[#736683]">
            <MessageSquareText className="h-3.5 w-3.5" />
            {communityBrief?.activeDiscussions ?? discussions.length} discussions
          </span>
          <span className="workspace-pill border-[#2F1D3B]/8 bg-white text-[#736683]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {communityBrief?.verifiedLawyers ?? topLawyers.length} trusted contributors
          </span>
        </div>

        <DiscussionsFeaturedSection featuredDiscussions={featuredDiscussions} />

        <div className="mt-6 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <DiscussionsDiscoverySidebar
            sidebarLoading={sidebarLoading}
            trendingTopics={trendingTopics}
            topLawyers={topLawyers}
            focusCategories={focusCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={(value) => {
              setSelectedCategory(value);
              setActiveQuickFilter(value ? `category:${value}` : null);
            }}
          />

          <main className="min-w-0">
            <DiscussionsFeedToolbar
              loading={loading}
              discussionsCount={discussions.length}
              totalPages={totalPages}
              page={page}
              searchQuery={searchQuery}
              sort={sort}
              selectedCategory={selectedCategory}
              selectedRegion={selectedRegion}
              categories={categories}
              regions={regions}
              sortOptions={sortOptions}
              quickFilters={quickFilters}
              activeQuickFilter={activeQuickFilter}
              activeFilterChips={activeFilterChips}
              hasFilters={hasFilters}
              onSearchChange={setSearchQuery}
              onSortChange={setSort}
              onCategoryChange={setSelectedCategory}
              onRegionChange={setSelectedRegion}
              onApplyQuickFilter={applyQuickFilter}
              onClearSingleFilter={clearSingleFilter}
              onClearAll={clearFilters}
              onPrevPage={() => setPage((current) => Math.max(1, current - 1))}
              onNextPage={() => setPage((current) => Math.min(totalPages, current + 1))}
            />

            {pageError ? (
              <div className="mb-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pageError}
              </div>
            ) : null}

            {loading ? (
              <div className="workspace-sidebar overflow-hidden p-0">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="lh-skeleton h-40 border-b border-[#2F1D3B]/8 last:border-b-0" />
                ))}
              </div>
            ) : discussions.length === 0 ? (
              <div className="workspace-sidebar px-6 py-14 text-center">
                <h2 className="text-xl font-semibold text-[#2F1D3B]">No discussions match this view</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#736683]">
                  Try clearing one or two filters, broadening the search terms, or switching back to the latest activity view.
                </p>
                <button onClick={clearFilters} className="legal-button-primary mt-6 text-sm">
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="workspace-sidebar overflow-hidden p-0">
                {discussions.map((discussion) => (
                  <DiscussionCard
                    key={discussion.id}
                    id={discussion.id}
                    slug={discussion.slug}
                    kind={discussion.kind}
                    title={discussion.title}
                    excerpt={discussion.excerpt}
                    status={discussion.status}
                    score={discussion.score}
                    reactionCount={discussion.reactionCount}
                    answerCount={discussion.answerCount}
                    viewCount={discussion.viewCount}
                    isPinned={discussion.isPinned}
                    isAiSummaryReady={discussion.isAiSummaryReady}
                    createdAt={discussion.createdAt}
                    author={discussion.author}
                    category={discussion.category}
                    region={discussion.region}
                    tags={discussion.tags}
                    isSaved={Boolean(discussion.bookmarks?.length)}
                    isLoggedIn={Boolean(user)}
                    initialEmojiStats={buildEmojiStats(discussion.reactions)}
                    userReaction={(() => {
                      const currentReaction = discussion.reactions?.find((reaction) => reaction.userId === user?.id);
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
          </main>
        </div>
      </div>

      <StartDiscussionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
