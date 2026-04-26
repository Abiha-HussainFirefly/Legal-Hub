'use client';

import CaseFilterChip from '@/app/components/cases/case-filter-chip';
import type {
  CaseRepositoryFilters,
  CaseRepositorySort,
} from '@/types/case';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

interface MetaOption {
  id: string;
  name: string;
}

interface CourtOption extends MetaOption {
  level: 'LOCAL' | 'DISTRICT' | 'HIGH' | 'APPELLATE' | 'SUPREME' | 'TRIBUNAL' | 'OTHER';
}

interface ActiveFilterChip {
  key: keyof CaseRepositoryFilters;
  label: string;
  prefix: string;
}

interface QuickFilterPreset {
  label: string;
  type: 'sourceType' | 'status' | 'authorScope' | 'visibility';
  value: string;
}

const controlClass =
  'h-11 appearance-none rounded-[12px] border border-[#2F1D3B]/10 bg-white pl-4 pr-4 text-sm font-semibold text-[#2F1D3B] outline-none transition hover:bg-[#F8F6FB] focus:border-[#4C2F5E]/30 focus:ring-4 focus:ring-[#4C2F5E]/8';

export default function CaseFeedToolbar({
  loading,
  resultsCount,
  searchQuery,
  sort,
  selectedCategory,
  selectedRegion,
  selectedCourt,
  categories,
  regions,
  courts,
  sortOptions,
  quickFilterPresets,
  filters,
  activeFilterChips,
  hasFilters,
  showAdvancedFilters,
  activeAdvancedCount,
  tags,
  organizations,
  sourceTypes,
  visibilities,
  statuses,
  onSearchChange,
  onSortChange,
  onCategoryChange,
  onRegionChange,
  onCourtChange,
  onToggleAdvancedFilters,
  onAdvancedFilterChange,
  onQuickFilterToggle,
  onClearSingleFilter,
  onClearAll,
}: {
  loading: boolean;
  resultsCount: number;
  searchQuery: string;
  sort: CaseRepositorySort;
  selectedCategory: string;
  selectedRegion: string;
  selectedCourt: string;
  categories: MetaOption[];
  regions: MetaOption[];
  courts: CourtOption[];
  sortOptions: Array<{ label: string; value: CaseRepositorySort }>;
  quickFilterPresets: readonly QuickFilterPreset[];
  filters: CaseRepositoryFilters;
  activeFilterChips: ActiveFilterChip[];
  hasFilters: boolean;
  showAdvancedFilters: boolean;
  activeAdvancedCount: number;
  tags: MetaOption[];
  organizations: MetaOption[];
  sourceTypes: string[];
  visibilities: string[];
  statuses: string[];
  onSearchChange: (value: string) => void;
  onSortChange: (value: CaseRepositorySort) => void;
  onCategoryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onCourtChange: (value: string) => void;
  onToggleAdvancedFilters: () => void;
  onAdvancedFilterChange: (key: keyof CaseRepositoryFilters, value: string) => void;
  onQuickFilterToggle: (type: QuickFilterPreset['type'], value: string) => void;
  onClearSingleFilter: (key: keyof CaseRepositoryFilters) => void;
  onClearAll: () => void;
}) {
  return (
    <section id="case-filters" className="space-y-3 scroll-mt-24">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7D99]" />
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search title, citation, court, region, or tag"
          className="h-12 w-full rounded-[14px] border border-[#2F1D3B]/10 bg-white pl-11 pr-4 text-base text-[#2F1D3B] outline-none transition placeholder:text-[#9A90A4] focus:border-[#4C2F5E]/30 focus:ring-4 focus:ring-[#4C2F5E]/8"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <select
            className={controlClass}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as CaseRepositorySort)}
            aria-label="Sort cases"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="relative">
          <select
            className={controlClass}
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
        </label>

        <label className="relative">
          <select
            className={controlClass}
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
        </label>

        <label className="relative">
          <select
            className={controlClass}
            value={selectedCourt}
            onChange={(event) => onCourtChange(event.target.value)}
            aria-label="Court"
          >
            <option value="">Court</option>
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onToggleAdvancedFilters}
          className={`inline-flex h-11 items-center gap-2 rounded-[12px] border px-4 text-sm font-semibold transition ${
            showAdvancedFilters || activeAdvancedCount
              ? 'border-[#4C2F5E]/18 bg-[#F1EAF6] text-[#4C2F5E]'
              : 'border-[#2F1D3B]/10 bg-white text-[#5E516B] hover:bg-[#F8F6FB]'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced
          {activeAdvancedCount ? (
            <span className="rounded-full bg-[#4C2F5E] px-2 py-0.5 text-[11px] text-white">
              {activeAdvancedCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {quickFilterPresets.map((preset) => {
          const isActive = filters[preset.type] === preset.value;

          return (
            <button
              key={`${preset.type}-${preset.value}`}
              type="button"
              onClick={() => onQuickFilterToggle(preset.type, preset.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-[#4C2F5E]/18 bg-[#4C2F5E] text-white'
                  : 'border-[#2F1D3B]/10 bg-white text-[#5E516B] hover:bg-[#F8F6FB]'
              }`}
            >
              {preset.label}
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

      {activeFilterChips.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#2F1D3B]/8 bg-[#FBF9FD] px-3 py-3">
          {activeFilterChips.map((chip) => (
            <CaseFilterChip
              key={`${chip.key}-${chip.label}`}
              prefix={chip.prefix}
              label={chip.label}
              onRemove={() => onClearSingleFilter(chip.key)}
            />
          ))}
        </div>
      ) : null}

      {showAdvancedFilters ? (
        <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF8FD] p-4 shadow-[0_10px_22px_rgba(16,27,40,0.03)] lh-form-enter">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">
                Advanced filters
              </p>
              <p className="mt-1 text-sm text-[#736683]">
                Apply metadata, access, and author constraints without pushing the whole page into a long form.
              </p>
            </div>
            {activeAdvancedCount ? (
              <span className="rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-1 text-xs font-semibold text-[#4C2F5E]">
                {activeAdvancedCount} active
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Tag</span>
              <select
                className={`${controlClass} mt-2 w-full`}
                value={filters.tag}
                onChange={(event) => onAdvancedFilterChange('tag', event.target.value)}
                aria-label="Tag"
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Organization</span>
              <select
                className={`${controlClass} mt-2 w-full`}
                value={filters.organization}
                onChange={(event) => onAdvancedFilterChange('organization', event.target.value)}
                aria-label="Organization"
              >
                <option value="">All organizations</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Source type</span>
              <select
                className={`${controlClass} mt-2 w-full`}
                value={filters.sourceType}
                onChange={(event) => onAdvancedFilterChange('sourceType', event.target.value)}
                aria-label="Source type"
              >
                <option value="">All source types</option>
                {sourceTypes.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Visibility</span>
              <select
                className={`${controlClass} mt-2 w-full`}
                value={filters.visibility}
                onChange={(event) => onAdvancedFilterChange('visibility', event.target.value)}
                aria-label="Visibility"
              >
                <option value="">All visibility</option>
                {visibilities.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Status</span>
              <select
                className={`${controlClass} mt-2 w-full`}
                value={filters.status}
                onChange={(event) => onAdvancedFilterChange('status', event.target.value)}
                aria-label="Status"
              >
                <option value="">All status</option>
                {statuses.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Author scope</span>
              <select
                className={`${controlClass} mt-2 w-full`}
                value={filters.authorScope}
                onChange={(event) => onAdvancedFilterChange('authorScope', event.target.value)}
                aria-label="Author scope"
              >
                <option value="">All authors</option>
                <option value="mine">My cases</option>
                <option value="verified">Verified lawyers only</option>
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Date range</span>
              <select
                className={`${controlClass} mt-2 w-full`}
                value={filters.dateRange}
                onChange={(event) => onAdvancedFilterChange('dateRange', event.target.value)}
                aria-label="Date range"
              >
                <option value="">All dates</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-b border-[#2F1D3B]/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#736683]" aria-live="polite">
          {loading ? 'Loading case records...' : `${resultsCount} record${resultsCount === 1 ? '' : 's'} shown`}
        </p>
      </div>
    </section>
  );
}
