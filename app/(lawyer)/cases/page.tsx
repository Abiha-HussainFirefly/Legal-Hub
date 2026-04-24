'use client';

import CaseResultCard from '@/app/components/cases/case-result-card';
import { useCaseWorkspace } from '@/app/components/cases/case-workspace';
import { useToast } from '@/app/components/ui/toast/toast-context';
import type { CaseRepositoryFilterOptions, CaseRepositoryFilters, CaseRepositoryRecord, CaseRepositorySort } from '@/types/case';
import { ArrowUpRight, BriefcaseBusiness, Filter, Grid2X2, List, Plus, Search, SlidersHorizontal, Sparkles, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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

function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#4C2F5E]/10 bg-white">
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-[#F1EAF6]" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-[#F4EFF7]" />
        </div>
        <div className="h-6 w-3/4 animate-pulse rounded-xl bg-[#F4EFF7]" />
        <div className="h-4 w-full animate-pulse rounded-xl bg-[#F4EFF7]" />
        <div className="h-4 w-11/12 animate-pulse rounded-xl bg-[#F4EFF7]" />
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-[18px] bg-[#F4EFF7]" />
          ))}
        </div>
      </div>
    </div>
  );
}

const quickFilterPresets = [
  { label: 'Official court', type: 'sourceType', value: 'OFFICIAL_COURT' },
  { label: 'Published only', type: 'status', value: 'PUBLISHED' },
  { label: 'My cases', type: 'authorScope', value: 'mine' },
  { label: 'Organization access', type: 'visibility', value: 'ORGANIZATION' },
] as const;

export default function CaseRepositoryPage() {
  const { user } = useCaseWorkspace();
  const { addToast } = useToast();
  const [filters, setFilters] = useState<CaseRepositoryFilters>(defaultFilters);
  const [filterOptions, setFilterOptions] = useState<CaseRepositoryFilterOptions>(emptyFilterOptions);
  const [records, setRecords] = useState<CaseRepositoryRecord[]>([]);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [metaLoading, setMetaLoading] = useState(true);
  const [recordsReady, setRecordsReady] = useState(false);
  const canFetchMine = filters.authorScope !== 'mine' || Boolean(user?.id);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/cases/meta')
      .then(async (response) => {
        const payload = (await response.json()) as MetaResponse & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load repository filters.');
        }
        if (cancelled) return;

        setFilterOptions((current) => ({
          ...current,
          categories: payload.categories ?? [],
          tags: payload.tags ?? [],
          regions: payload.regions ?? [],
          courts: payload.courts ?? [],
          organizations: payload.organizations ?? [],
        }));
      })
      .catch((error) => {
        if (!cancelled) {
          addToast('error', 'Case filters unavailable', error instanceof Error ? error.message : 'Unable to load repository filters.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMetaLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [addToast]);

  useEffect(() => {
    let cancelled = false;

    if (!canFetchMine) {
      return;
    }

    const params = new URLSearchParams();
    if (filters.search.trim()) params.set('search', filters.search.trim());
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

    fetch(`/api/cases?${params.toString()}`)
      .then(async (response) => {
        const payload = (await response.json()) as { data?: CaseRepositoryRecord[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load cases.');
        }
        if (!cancelled) {
          setRecords(payload.data ?? []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRecords([]);
          addToast('error', 'Cases unavailable', error instanceof Error ? error.message : 'Unable to load cases.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRecordsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    addToast,
    canFetchMine,
    filters.authorScope,
    filters.category,
    filters.court,
    filters.dateRange,
    filters.organization,
    filters.region,
    filters.search,
    filters.sort,
    filters.sourceType,
    filters.tag,
    filters.visibility,
    user?.id,
  ]);

  const loading = metaLoading || (canFetchMine && !recordsReady);
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
    const pending = records.filter((item) => item.status === 'PENDING_REVIEW');
    const officialSources = records.filter((item) => item.sourceType === 'OFFICIAL_COURT');
    const officialCoverage = records.length ? `${Math.round((officialSources.length / records.length) * 100)}%` : '0%';

    return [
      { label: 'Published records', value: `${published.length}`, detail: 'Structured case entries ready for public research and citation tracking.' },
      { label: 'Pending review', value: `${pending.length}`, detail: 'Contributor drafts waiting on editorial quality, source, or moderation checks.' },
      { label: 'Official-source coverage', value: officialCoverage, detail: 'Repository items grounded directly in court-issued material.' },
    ];
  }, [records]);
  const featured = useMemo(
    () =>
      [...results]
        .sort(
          (left, right) =>
            right.counts.inboundCitations +
            right.counts.outboundCitations -
            (left.counts.inboundCitations + left.counts.outboundCitations),
        )
        .slice(0, 3),
    [results],
  );
  const categoryQuickLinks = useMemo(() => filterOptions.categories.slice(0, 4), [filterOptions.categories]);
  const spotlightCase = featured[0];
  const taxonomyFilterGroups = useMemo(
    () =>
      [
        { label: 'Category', key: 'category', options: filterOptions.categories },
        { label: 'Tag', key: 'tag', options: filterOptions.tags },
        { label: 'Region', key: 'region', options: filterOptions.regions },
        { label: 'Court', key: 'court', options: filterOptions.courts },
        { label: 'Organization', key: 'organization', options: filterOptions.organizations },
      ] as Array<{
        label: string;
        key: 'category' | 'tag' | 'region' | 'court' | 'organization';
        options: Array<{ id: string; name: string }>;
      }>,
    [filterOptions.categories, filterOptions.courts, filterOptions.organizations, filterOptions.regions, filterOptions.tags],
  );
  const activeFilterCount = useMemo(
    () =>
      [filters.category, filters.tag, filters.region, filters.court, filters.sourceType, filters.visibility, filters.status, filters.authorScope, filters.organization, filters.dateRange]
        .filter(Boolean).length,
    [filters],
  );
  const activeFilterPills = useMemo(
    () =>
      [
        filters.category && { key: 'category', label: filterOptions.categories.find((item) => item.id === filters.category)?.name ?? filters.category },
        filters.tag && { key: 'tag', label: filterOptions.tags.find((item) => item.id === filters.tag)?.name ?? filters.tag },
        filters.region && { key: 'region', label: filterOptions.regions.find((item) => item.id === filters.region)?.name ?? filters.region },
        filters.court && { key: 'court', label: filterOptions.courts.find((item) => item.id === filters.court)?.name ?? filters.court },
        filters.sourceType && { key: 'sourceType', label: filters.sourceType.replaceAll('_', ' ') },
        filters.visibility && { key: 'visibility', label: filters.visibility },
        filters.status && { key: 'status', label: filters.status.replaceAll('_', ' ') },
        filters.authorScope && { key: 'authorScope', label: filters.authorScope === 'mine' ? 'My cases' : 'Verified lawyers' },
        filters.organization && { key: 'organization', label: filterOptions.organizations.find((item) => item.id === filters.organization)?.name ?? filters.organization },
        filters.dateRange && { key: 'dateRange', label: filters.dateRange === '30d' ? 'Last 30 days' : filters.dateRange === '90d' ? 'Last 90 days' : 'Last year' },
      ].filter(Boolean) as Array<{ key: keyof CaseRepositoryFilters; label: string }>,
    [filterOptions.categories, filterOptions.courts, filterOptions.organizations, filterOptions.regions, filterOptions.tags, filters],
  );

  function clearSingleFilter(key: keyof CaseRepositoryFilters) {
    setFilters((current) => ({ ...current, [key]: key === 'sort' ? 'relevant' : '' }));
  }

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 md:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[30px] border border-[#4C2F5E]/10 bg-white shadow-[0_16px_40px_rgba(76,47,94,0.07)]">
        <div className="bg-[linear-gradient(135deg,#4C2F5E_0%,#735092_100%)] px-6 py-7 text-white md:px-8 md:py-8">
          <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
              <Sparkles className="h-3.5 w-3.5" />
                Research workspace
              </p>
              <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-white md:text-[3.25rem]">
                Case Repository
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 md:text-base">
                Search structured case records, review provenance, compare jurisdictions, and move between repository research and authored drafts without leaving the same workspace.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/cases/new" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#4C2F5E] transition hover:bg-white/90">
                  <Plus className="h-4 w-4" />
                  Create case draft
                </Link>
                <Link href="/cases/mine" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14">
                  My cases
                </Link>
                <Link href="/cases/saved" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14">
                  Saved & followed
                </Link>
              </div>

              <div className="mt-6 max-w-3xl rounded-[24px] border border-white/12 bg-white/10 p-3 backdrop-blur">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                  <input
                    className="w-full rounded-[16px] border border-white/10 bg-white/12 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-white/25 focus:bg-white/16"
                    value={filters.search}
                    onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    placeholder="Search title, citation, court, region, or tag"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickFilterPresets.map((preset) => {
                    const isActive = filters[preset.type] === preset.value;
                    return (
                      <button
                        key={preset.label}
                        onClick={() =>
                          setFilters((current) => ({
                            ...current,
                            [preset.type]: current[preset.type] === preset.value ? '' : preset.value,
                          }))
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                          isActive
                            ? 'border-white/20 bg-white text-[#4C2F5E]'
                            : 'border-white/12 bg-white/10 text-white/85 hover:bg-white/16'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
          </div>
        </div>
        <div className="grid gap-3 border-t border-[#4C2F5E]/10 bg-[#FBF9FD] px-6 py-4 md:grid-cols-4 md:px-8">
          {[
            ['Active filters', `${activeFilterCount}`],
            ['Visible results', `${results.length}`],
            ['Current sort', sortOptions.find((option) => option.value === filters.sort)?.label ?? 'Most relevant'],
            ['Display', view === 'grid' ? 'Grid view' : 'List view'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[18px] border border-[#4C2F5E]/8 bg-white p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{label}</p>
              <p className="mt-1.5 text-base font-semibold text-[#2F1D3B]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-[24px] border border-[#4C2F5E]/10 bg-white p-4.5 shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F1EAF6] text-[#4C2F5E]">
                <Filter className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Structured filters</p>
                <h2 className="text-lg font-semibold text-[#2F1D3B]">Refine results</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-[22px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Filters applied</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{activeFilterCount}</p>
                  </div>
                  {activeFilterCount ? (
                    <button
                      onClick={() => setFilters(defaultFilters)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4C2F5E]"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-7 text-[#706181]">
                  Narrow the repository by legal metadata, source credibility, visibility, and ownership.
                </p>
              </div>

              {taxonomyFilterGroups.map(({ label, key, options }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{label}</label>
                  <select
                    className="legal-field mt-2"
                    value={filters[key]}
                    onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
                  >
                    <option value="">All {label}</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Source type</label>
                  <select
                    className="legal-field mt-2"
                    value={filters.sourceType}
                    onChange={(event) => setFilters((current) => ({ ...current, sourceType: event.target.value }))}
                  >
                    <option value="">All source types</option>
                    {filterOptions.sourceTypes.map((option) => (
                      <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Visibility</label>
                  <select
                    className="legal-field mt-2"
                    value={filters.visibility}
                    onChange={(event) => setFilters((current) => ({ ...current, visibility: event.target.value }))}
                  >
                    <option value="">All visibility</option>
                    {filterOptions.visibilities.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Status</label>
                  <select
                    className="legal-field mt-2"
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="">All status</option>
                    {filterOptions.statuses.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Author scope</label>
                  <select
                    className="legal-field mt-2"
                    value={filters.authorScope}
                    onChange={(event) => setFilters((current) => ({ ...current, authorScope: event.target.value }))}
                  >
                    <option value="">All authors</option>
                    <option value="mine">My cases</option>
                    <option value="verified">Verified lawyers only</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Date range</label>
                  <select
                    className="legal-field mt-2"
                    value={filters.dateRange}
                    onChange={(event) => setFilters((current) => ({ ...current, dateRange: event.target.value }))}
                  >
                    <option value="">All dates</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setFilters(defaultFilters)}
                className="legal-button-secondary w-full text-sm"
              >
                Reset filters
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#4C2F5E]/10 bg-white p-4.5 shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F1EAF6] text-[#4C2F5E]">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Repository snapshot</p>
                <h2 className="text-lg font-semibold text-[#2F1D3B]">Research desk</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#706181]">
              Quick repository coverage and the strongest current precedent without taking over the hero.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 border-y border-[#4C2F5E]/10 py-4">
              <div className="min-w-[90px] flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Visible</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{results.length}</p>
              </div>
              <div className="min-w-[90px] flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Published</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{insights[1]?.value ?? '0'}</p>
              </div>
              <div className="min-w-[90px] flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Official</p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{insights[2]?.value ?? '0%'}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-[#4C2F5E]/10 bg-[linear-gradient(180deg,#fbf9fd_0%,#ffffff_100%)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Spotlight record</p>
                <span className="rounded-full border border-[#4C2F5E]/10 bg-[#F7F3FA] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4C2F5E]">
                  Featured
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#2F1D3B]">
                {spotlightCase?.title ?? 'High-signal precedents appear here as repository data grows.'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">
                {spotlightCase?.canonicalCitation ?? 'Featured cases are surfaced from repository engagement and authority signals.'}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {featured.slice(1).map((item) => (
                <Link key={item.id} href={`/cases/${item.slug}`} className="block rounded-[18px] border border-[#4C2F5E]/10 bg-[linear-gradient(180deg,#fbf9fd_0%,#ffffff_100%)] p-3.5 transition hover:border-[#4C2F5E]/18 hover:bg-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{item.canonicalCitation}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#2F1D3B]">{item.title}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#4C2F5E]/10 bg-white p-4.5 shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Browse by category</p>
            <div className="mt-4 space-y-3">
              {categoryQuickLinks.map((category) => {
                const active = filters.category === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setFilters((current) => ({ ...current, category: current.category === category.id ? '' : category.id }))}
                    className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-3 text-left text-sm font-semibold transition ${
                      active
                        ? 'border-[#4C2F5E] bg-[#F6F1FA] text-[#4C2F5E]'
                        : 'border-[#4C2F5E]/10 bg-[#FBF9FD] text-[#2F1D3B] hover:bg-white'
                    }`}
                  >
                    <span>{category.name}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-5 flex flex-col gap-4 rounded-[24px] border border-[#4C2F5E]/10 bg-white p-4.5 shadow-[0_12px_30px_rgba(76,47,94,0.05)] md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Case explorer</p>
              <p className="mt-2 text-base font-semibold text-[#2F1D3B]">
                {loading ? 'Loading repository...' : `${results.length} result${results.length === 1 ? '' : 's'} found`}
              </p>
              <p className="text-sm text-[#706181]">
                Review trusted records, compare jurisdictions, and move into detail pages with less visual noise.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-[#FBF9FD] p-1">
                <button
                  onClick={() => setView('list')}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${view === 'list' ? 'bg-[#4C2F5E] text-white' : 'text-[#4C2F5E]'}`}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${view === 'grid' ? 'bg-[#4C2F5E] text-white' : 'text-[#4C2F5E]'}`}
                >
                  <Grid2X2 className="h-4 w-4" />
                  Grid
                </button>
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#8C7A9B]" />
                <select
                  className="rounded-full border border-[#4C2F5E]/10 bg-white px-4 py-2 text-sm font-semibold text-[#4C2F5E] outline-none"
                  value={filters.sort}
                  onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as CaseRepositorySort }))}
                >
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {activeFilterPills.length ? (
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-[20px] border border-[#4C2F5E]/10 bg-white p-3.5 shadow-[0_10px_24px_rgba(76,47,94,0.04)]">
              {activeFilterPills.map((pill) => (
                <button
                  key={`${pill.key}-${pill.label}`}
                  onClick={() => clearSingleFilter(pill.key)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-[#F7F3FA] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4C2F5E]"
                >
                  {pill.label}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => <ResultSkeleton key={item} />)}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-[28px] border border-[#4C2F5E]/10 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F1EAF6] text-[#4C2F5E]">
                <BriefcaseBusiness className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-[#2F1D3B]">No cases match these filters</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-[#706181]">
                Try widening the search scope, clearing the status filter, or switching to a different source type.
              </p>
              <button onClick={() => setFilters(defaultFilters)} className="legal-button-primary mt-6 text-sm">
                Reset filters
              </button>
            </div>
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
