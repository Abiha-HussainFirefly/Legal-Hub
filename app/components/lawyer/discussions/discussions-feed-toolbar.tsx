'use client';

import DiscussionFilterChip from '@/app/components/lawyer/discussions/discussion-filter-chip';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';

interface MetaOption {
  id: string;
  name: string;
}

interface QuickFilterOption {
  key: string;
  label: string;
  type: 'category' | 'search';
  value: string;
}

interface ActiveFilterChip {
  key: 'search' | 'sort' | 'category' | 'region';
  label: string;
  prefix: string;
}

export default function DiscussionsFeedToolbar({
  loading,
  discussionsCount,
  totalPages,
  page,
  searchQuery,
  sort,
  selectedCategory,
  selectedRegion,
  categories,
  regions,
  sortOptions,
  quickFilters,
  activeQuickFilter,
  activeFilterChips,
  hasFilters,
  onSearchChange,
  onSortChange,
  onCategoryChange,
  onRegionChange,
  onApplyQuickFilter,
  onClearSingleFilter,
  onClearAll,
  onPrevPage,
  onNextPage,
}: {
  loading: boolean;
  discussionsCount: number;
  totalPages: number;
  page: number;
  searchQuery: string;
  sort: string;
  selectedCategory: string;
  selectedRegion: string;
  categories: MetaOption[];
  regions: MetaOption[];
  sortOptions: Array<{ label: string; value: string }>;
  quickFilters: QuickFilterOption[];
  activeQuickFilter: string | null;
  activeFilterChips: ActiveFilterChip[];
  hasFilters: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onApplyQuickFilter: (filter: QuickFilterOption) => void;
  onClearSingleFilter: (key: ActiveFilterChip['key']) => void;
  onClearAll: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <section className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7D99]" />
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search all discussions"
          className="h-12 w-full rounded-[14px] border border-[#2F1D3B]/10 bg-white pl-11 pr-4 text-base text-[#2F1D3B] outline-none transition placeholder:text-[#9A90A4] focus:border-[#4C2F5E]/30 focus:ring-4 focus:ring-[#4C2F5E]/8"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSortChange('latest')}
          className={`rounded-[12px] border px-4 py-2.5 text-sm font-semibold transition ${
            sort === 'latest'
              ? 'border-[#4C2F5E]/18 bg-[#F1EAF6] text-[#4C2F5E]'
              : 'border-[#2F1D3B]/10 bg-white text-[#5E516B] hover:bg-[#F8F6FB]'
          }`}
        >
          New
        </button>

        <label className="relative">
          <select
            className="h-11 appearance-none rounded-[12px] border border-[#2F1D3B]/10 bg-white pl-4 pr-9 text-sm font-semibold text-[#2F1D3B] outline-none transition hover:bg-[#F8F6FB] focus:border-[#4C2F5E]/30 focus:ring-4 focus:ring-[#4C2F5E]/8"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort discussions"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === 'latest' ? 'Top: Latest activity' : `Top: ${option.label}`}
              </option>
            ))}
          </select>
          {/* <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7D99]" /> */}
        </label>

        <label className="relative">
          <select
            className="h-11 appearance-none rounded-[12px] border border-[#2F1D3B]/10 bg-white pl-4 pr-9 text-sm font-semibold text-[#2F1D3B] outline-none transition hover:bg-[#F8F6FB] focus:border-[#4C2F5E]/30 focus:ring-4 focus:ring-[#4C2F5E]/8"
            value={selectedRegion}
            onChange={(event) => onRegionChange(event.target.value)}
            aria-label="Region"
          >
            <option value="">Region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {/* <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7D99]" /> */}
        </label>

        <label className="relative">
          <select
            className="h-11 appearance-none rounded-[12px] border border-[#2F1D3B]/10 bg-white pl-4 pr-9 text-sm font-semibold text-[#2F1D3B] outline-none transition hover:bg-[#F8F6FB] focus:border-[#4C2F5E]/30 focus:ring-4 focus:ring-[#4C2F5E]/8"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            aria-label="Category"
          >
            <option value="">Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {/* <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7D99]" /> */}
        </label>
      </div>

      {(quickFilters.length > 0 || hasFilters) ? (
        <div className="flex flex-wrap items-center gap-2">
          {quickFilters.map((filter) => {
            const isActive = activeQuickFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onApplyQuickFilter(filter)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'border-[#4C2F5E]/18 bg-[#4C2F5E] text-white'
                    : 'border-[#2F1D3B]/10 bg-white text-[#5E516B] hover:bg-[#F8F6FB]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}

          {hasFilters ? (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4C2F5E]/12 bg-[#F7F3FA] px-3 py-1.5 text-xs font-semibold text-[#4C2F5E] transition hover:bg-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null}
        </div>
      ) : null}

      {activeFilterChips.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#2F1D3B]/8 bg-[#FBF9FD] px-3 py-3">
          {activeFilterChips.map((chip) => (
            <DiscussionFilterChip
              key={`${chip.key}-${chip.label}`}
              prefix={chip.prefix}
              label={chip.label}
              onRemove={() => onClearSingleFilter(chip.key)}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-b border-[#2F1D3B]/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#736683]" aria-live="polite">
          {loading ? 'Loading discussions...' : `${discussionsCount} discussion${discussionsCount === 1 ? '' : 's'} shown`}
        </p>

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={page === 1}
              className="rounded-[10px] border border-[#2F1D3B]/10 bg-white px-3 py-2 text-sm font-semibold text-[#5E516B] transition hover:bg-[#F8F6FB] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-[#8B7D99]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={onNextPage}
              disabled={page === totalPages}
              className="rounded-[10px] border border-[#2F1D3B]/10 bg-white px-3 py-2 text-sm font-semibold text-[#5E516B] transition hover:bg-[#F8F6FB] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
