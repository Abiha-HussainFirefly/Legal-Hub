'use client';

import CaseEmptyState from '@/app/components/cases/case-empty-state';
import CaseDiscoverySidebar from '@/app/components/cases/case-discovery-sidebar';
import CaseFeedToolbar from '@/app/components/cases/case-feed-toolbar';
import CaseResultCard from '@/app/components/cases/case-result-card';
import CaseResultSkeleton from '@/app/components/cases/case-result-skeleton';
import AnimatedLink from '@/app/components/ui/animated-link';
import { useCaseWorkspace } from '@/app/components/cases/case-workspace';
import { useToast } from '@/app/components/ui/toast/toast-context';
import { apiRequest, getErrorMessage } from '@/lib/api-client';
import type { CaseRepositoryFilterOptions, CaseRepositoryFilters, CaseRepositoryRecord, CaseRepositorySort } from '@/types/case';
import { BriefcaseBusiness, Grid2X2, List, Plus, Sparkles } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

const sortOptions: Array<{ label: string; value: CaseRepositorySort }> = [
  { label: 'Most relevant', value: 'relevant' },
  { label: 'Most recent', value: 'recent' },
  { label: 'Decision date', value: 'decision_date' },
  { label: 'Most viewed', value: 'views' },
  { label: 'Most followed', value: 'follows' },
  { label: 'Most helpful', value: 'helpful' },
  { label: 'Most cited', value: 'cited' },
];

const defaultFilters: CaseRepositoryFilters = {
  search: '',
  category: '',
  tag: '',
  region: '',
  court: '',
  sourceType: '',
  visibility: '',
  status: '',
  authorScope: '',
  organization: '',
  dateRange: '',
  sort: 'relevant',
};

const emptyFilterOptions: CaseRepositoryFilterOptions = {
  categories: [],
  tags: [],
  regions: [],
  courts: [],
  organizations: [],
  sourceTypes: ['USER_SUBMITTED', 'OFFICIAL_COURT', 'IMPORTED_EDITORIAL', 'COMMUNITY_CURATED'],
  statuses: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'REMOVED'],
  visibilities: ['PUBLIC', 'UNLISTED', 'PRIVATE', 'ORGANIZATION'],
};

interface MetaResponse {
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  regions: Array<{ id: string; name: string }>;
  courts: Array<{ id: string; name: string; level: 'LOCAL' | 'DISTRICT' | 'HIGH' | 'APPELLATE' | 'SUPREME' | 'TRIBUNAL' | 'OTHER' }>;
  organizations: Array<{ id: string; name: string }>;
}

const quickFilterPresets = [
  { label: 'Official court records', type: 'sourceType', value: 'OFFICIAL_COURT' },
  { label: 'Ready to read', type: 'status', value: 'PUBLISHED' },
  { label: 'My drafted cases', type: 'authorScope', value: 'mine' },
  { label: 'Organization only', type: 'visibility', value: 'ORGANIZATION' },
] as const;

const filterFieldLabels: Partial<Record<keyof CaseRepositoryFilters, string>> = {
  search: 'Search',
  category: 'Category',
  tag: 'Topic tag',
  region: 'Region',
  court: 'Court',
  sourceType: 'Source',
  visibility: 'Access',
  status: 'Status',
  authorScope: 'Author',
  organization: 'Organization',
  dateRange: 'Date',
  sort: 'Sort',
};

export default function CaseRepositoryPage() {
  const { user } = useCaseWorkspace();
  const { addToast } = useToast();
  const [filters, setFilters] = useState<CaseRepositoryFilters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<CaseRepositoryFilterOptions>(emptyFilterOptions);
  const [records, setRecords] = useState<CaseRepositoryRecord[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const deferredSearch = useDeferredValue(filters.search.trim());
  const canFetchMine = filters.authorScope !== 'mine' || Boolean(user?.id);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMeta() {
      try {
        const payload = await apiRequest<MetaResponse>('/api/cases/meta', {
          signal: controller.signal,
          cache: 'no-store',
        });

        setFilterOptions((current) => ({
          ...current,
          categories: payload.categories ?? [],
          tags: payload.tags ?? [],
          regions: payload.regions ?? [],
          courts: payload.courts ?? [],
          organizations: payload.organizations ?? [],
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          addToast('error', 'Case filters unavailable', getErrorMessage(error, 'Unable to load repository filters.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setMetaLoading(false);
        }
      }
    }

    void loadMeta();

    return () => controller.abort();
  }, [addToast]);

  useEffect(() => {
    if (!canFetchMine) {
      setRecords([]);
      setRecordsLoading(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();

    if (deferredSearch) params.set('search', deferredSearch);
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.region) params.set('region', filters.region);
    if (filters.court) params.set('court', filters.court);
    if (filters.sourceType) params.set('sourceType', filters.sourceType);
    if (filters.visibility) params.set('visibility', filters.visibility);
    if (filters.organization) params.set('organization', filters.organization);
    if (filters.dateRange) params.set('dateRange', filters.dateRange);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.authorScope === 'mine') params.set('authorId', 'me');

    async function loadRecords() {
      setRecordsLoading(true);
      setPageError('');

      try {
        const payload = await apiRequest<{ data?: CaseRepositoryRecord[] }>(`/api/cases?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        setRecords(payload.data ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setRecords([]);
          setPageError(getErrorMessage(error, 'Unable to load cases.'));
          addToast('error', 'Cases unavailable', getErrorMessage(error, 'Unable to load cases.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setRecordsLoading(false);
        }
      }
    }

    void loadRecords();

    return () => controller.abort();
  }, [
    addToast,
    canFetchMine,
    deferredSearch,
    filters.authorScope,
    filters.category,
    filters.court,
    filters.dateRange,
    filters.organization,
    filters.region,
    filters.sort,
    filters.sourceType,
    filters.tag,
    filters.visibility,
    user?.id,
  ]);

  const loading = metaLoading || recordsLoading;
  const results = useMemo(
    () =>
      (canFetchMine ? records : []).filter((item) => {
        if (filters.status && item.status !== filters.status) return false;
        if (filters.authorScope === 'verified' && !item.author.isVerifiedLawyer) return false;
        return true;
      }),
    [canFetchMine, filters.authorScope, filters.status, records],
  );

  const insights = useMemo(() => {
    const published = records.filter((item) => item.status === 'PUBLISHED');
    const officialSources = records.filter((item) => item.sourceType === 'OFFICIAL_COURT');
    const officialCoverage = records.length ? `${Math.round((officialSources.length / records.length) * 100)}%` : '0%';

    return [
      { label: 'Visible records', value: `${results.length}` },
      { label: 'Published', value: `${published.length}` },
      { label: 'Official-source coverage', value: officialCoverage },
    ];
  }, [records, results.length]);

  const spotlightCase = useMemo(
    () =>
      [...results]
        .sort(
          (left, right) =>
            right.counts.inboundCitations +
            right.counts.outboundCitations -
            (left.counts.inboundCitations + left.counts.outboundCitations),
        )[0] ?? null,
    [results],
  );

  const activeFilterPills = useMemo(
    () =>
      [
        filters.search.trim() && {
          key: 'search' as const,
          label: filters.search.trim(),
        },
        filters.sort !== 'relevant' && {
          key: 'sort' as const,
          label: sortOptions.find((option) => option.value === filters.sort)?.label ?? filters.sort,
        },
        filters.category && {
          key: 'category',
          label: filterOptions.categories.find((item) => item.id === filters.category)?.name ?? filters.category,
        },
        filters.tag && {
          key: 'tag',
          label: filterOptions.tags.find((item) => item.id === filters.tag)?.name ?? filters.tag,
        },
        filters.region && {
          key: 'region',
          label: filterOptions.regions.find((item) => item.id === filters.region)?.name ?? filters.region,
        },
        filters.court && {
          key: 'court',
          label: filterOptions.courts.find((item) => item.id === filters.court)?.name ?? filters.court,
        },
        filters.sourceType && { key: 'sourceType', label: filters.sourceType.replaceAll('_', ' ') },
        filters.visibility && { key: 'visibility', label: filters.visibility },
        filters.status && { key: 'status', label: filters.status.replaceAll('_', ' ') },
        filters.authorScope && {
          key: 'authorScope',
          label: filters.authorScope === 'mine' ? 'My cases' : 'Verified lawyers',
        },
        filters.organization && {
          key: 'organization',
          label: filterOptions.organizations.find((item) => item.id === filters.organization)?.name ?? filters.organization,
        },
        filters.dateRange && {
          key: 'dateRange',
          label: filters.dateRange === '30d' ? 'Last 30 days' : filters.dateRange === '90d' ? 'Last 90 days' : 'Last year',
        },
      ].filter(Boolean) as Array<{ key: keyof CaseRepositoryFilters; label: string }>,
    [filterOptions.categories, filterOptions.courts, filterOptions.organizations, filterOptions.regions, filterOptions.tags, filters],
  );

  const advancedFilterCount = useMemo(
    () =>
      [
        filters.tag,
        filters.organization,
        filters.sourceType,
        filters.visibility,
        filters.status,
        filters.authorScope,
        filters.dateRange,
      ].filter(Boolean).length,
    [filters.authorScope, filters.dateRange, filters.organization, filters.sourceType, filters.status, filters.tag, filters.visibility],
  );

  const hasFilters = useMemo(
    () =>
      Boolean(
        filters.search.trim() ||
          filters.category ||
          filters.tag ||
          filters.region ||
          filters.court ||
          filters.sourceType ||
          filters.visibility ||
          filters.status ||
          filters.authorScope ||
          filters.organization ||
          filters.dateRange ||
          filters.sort !== 'relevant',
      ),
    [filters],
  );

  const categorySidebarItems = useMemo(() => {
    const counts = new Map<string, number>();

    for (const record of records) {
      counts.set(record.category.id, (counts.get(record.category.id) ?? 0) + 1);
    }

    return filterOptions.categories.map((category) => ({
      id: category.id,
      name: category.name,
      count: counts.get(category.id) ?? 0,
    }));
  }, [filterOptions.categories, records]);

  const activeFilterChips = useMemo(
    () =>
      activeFilterPills.map((pill) => ({
        ...pill,
        prefix: filterFieldLabels[pill.key] ?? 'Filter',
      })),
    [activeFilterPills],
  );

  useEffect(() => {
    if (advancedFilterCount > 0) {
      setShowAdvancedFilters(true);
    }
  }, [advancedFilterCount]);

  function clearSingleFilter(key: keyof CaseRepositoryFilters) {
    setFilters((current) => ({ ...current, [key]: key === 'sort' ? 'relevant' : '' }));
  }

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-6 md:px-6 lg:px-8 lh-page-enter">
      <section className="workspace-header p-5 md:p-6 lh-page-enter lh-delay-1">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="legal-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Plain-language case library
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-[#2F1D3B] md:text-[2.6rem]">
              Case Repository
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#736683] md:text-base">
              Search by issue, court, region, citation, or topic. Filters stay visible and removable so users always know why a record is appearing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AnimatedLink href="/cases/new" className="legal-button-primary text-sm">
              <Plus className="h-4 w-4" />
              New draft
            </AnimatedLink>
            <AnimatedLink href="/cases/mine" className="legal-button-secondary text-sm">
              My cases
            </AnimatedLink>
            <AnimatedLink href="/cases/saved" className="legal-button-secondary text-sm">
              Saved
            </AnimatedLink>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="grid flex-1 gap-3 md:grid-cols-3">
            {insights.map((insight) => (
              <div key={insight.label} className="rounded-[16px] border border-[#2F1D3B]/8 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{insight.label}</p>
                <p className="mt-1 text-lg font-semibold text-[#2F1D3B]">{insight.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-[16px] border border-[#2F1D3B]/8 bg-white p-1">
            <button
              onClick={() => setView('list')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold transition ${
                view === 'list' ? 'bg-[#4C2F5E] text-white' : 'text-[#6B5C79]'
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView('grid')}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] px-4 py-2 text-sm font-semibold transition ${
                view === 'grid' ? 'bg-[#4C2F5E] text-white' : 'text-[#6B5C79]'
              }`}
            >
              <Grid2X2 className="h-4 w-4" />
              Grid
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <CaseDiscoverySidebar
          categories={categorySidebarItems}
          selectedCategory={filters.category}
          onSelectCategory={(value) => setFilters((current) => ({ ...current, category: value }))}
          quickFilterPresets={quickFilterPresets}
          filters={filters}
          onQuickFilterToggle={(type, value) =>
            setFilters((current) => ({
              ...current,
              [type]: current[type] === value ? '' : value,
            }))
          }
          spotlightCase={spotlightCase}
        />

        <section className="min-w-0">
          <CaseFeedToolbar
            loading={loading}
            resultsCount={results.length}
            searchQuery={filters.search}
            sort={filters.sort}
            selectedCategory={filters.category}
            selectedRegion={filters.region}
            selectedCourt={filters.court}
            categories={filterOptions.categories}
            regions={filterOptions.regions}
            courts={filterOptions.courts}
            sortOptions={sortOptions}
            quickFilterPresets={quickFilterPresets}
            filters={filters}
            activeFilterChips={activeFilterChips}
            hasFilters={hasFilters}
            showAdvancedFilters={showAdvancedFilters}
            activeAdvancedCount={advancedFilterCount}
            tags={filterOptions.tags}
            organizations={filterOptions.organizations}
            sourceTypes={filterOptions.sourceTypes}
            visibilities={filterOptions.visibilities}
            statuses={filterOptions.statuses}
            onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
            onSortChange={(value) => setFilters((current) => ({ ...current, sort: value }))}
            onCategoryChange={(value) => setFilters((current) => ({ ...current, category: value }))}
            onRegionChange={(value) => setFilters((current) => ({ ...current, region: value }))}
            onCourtChange={(value) => setFilters((current) => ({ ...current, court: value }))}
            onToggleAdvancedFilters={() => setShowAdvancedFilters((current) => !current)}
            onAdvancedFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
            onQuickFilterToggle={(type, value) =>
              setFilters((current) => ({
                ...current,
                [type]: current[type] === value ? '' : value,
              }))
            }
            onClearSingleFilter={clearSingleFilter}
            onClearAll={() => setFilters(defaultFilters)}
          />

          {pageError ? (
            <div className="mb-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <CaseResultSkeleton key={item} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <CaseEmptyState
              icon={BriefcaseBusiness}
              title="No cases match these filters"
              description="Try removing one active chip, broadening the region or court, or clearing all filters to return to the full repository."
              action={
                <button type="button" onClick={() => setFilters(defaultFilters)} className="legal-button-primary text-sm">
                  Reset filters
                </button>
              }
            />
          ) : (
            <div className={view === 'grid' ? 'grid gap-4 lg:grid-cols-2' : 'space-y-4'}>
              {results.map((item) => (
                <CaseResultCard key={item.id} item={item} compact={view === 'grid'} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
