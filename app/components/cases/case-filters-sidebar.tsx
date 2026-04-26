'use client';

import type { CaseRepositoryFilters } from '@/types/case';
import { CheckCircle2, ChevronDown, Filter, RotateCcw } from 'lucide-react';
import CaseFilterChip from '@/app/components/cases/case-filter-chip';

interface FilterOption {
  id: string;
  name: string;
}

interface FilterGroup {
  label: string;
  key: 'category' | 'tag' | 'region' | 'court' | 'organization';
  options: FilterOption[];
}

interface ActiveFilterPill {
  key: keyof CaseRepositoryFilters;
  label: string;
}

interface QuickFilterPreset {
  label: string;
  type: 'sourceType' | 'status' | 'authorScope' | 'visibility';
  value: string;
}

function selectClass(active: boolean) {
  return `legal-field mt-2 ${active ? 'border-[#4C2F5E]/45 bg-[#FBF8FD] shadow-[0_0_0_4px_rgba(76,47,94,0.07)]' : ''}`;
}

export default function CaseFiltersSidebar({
  filters,
  activeFilterPills,
  filterFieldLabels,
  coreFilterGroups,
  advancedTaxonomyGroups,
  advancedFilterCount,
  showAdvancedFilters,
  quickFilterPresets,
  sourceTypes,
  visibilities,
  statuses,
  onFilterChange,
  onClearSingleFilter,
  onReset,
  onToggleAdvancedFilters,
  onQuickFilterToggle,
}: {
  filters: CaseRepositoryFilters;
  activeFilterPills: ActiveFilterPill[];
  filterFieldLabels: Partial<Record<keyof CaseRepositoryFilters, string>>;
  coreFilterGroups: FilterGroup[];
  advancedTaxonomyGroups: FilterGroup[];
  advancedFilterCount: number;
  showAdvancedFilters: boolean;
  quickFilterPresets: readonly QuickFilterPreset[];
  sourceTypes: string[];
  visibilities: string[];
  statuses: string[];
  onFilterChange: (key: keyof CaseRepositoryFilters, value: string) => void;
  onClearSingleFilter: (key: keyof CaseRepositoryFilters) => void;
  onReset: () => void;
  onToggleAdvancedFilters: () => void;
  onQuickFilterToggle: (type: QuickFilterPreset['type'], value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="workspace-sidebar p-5 lh-page-enter lh-delay-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#4C2F5E] text-white shadow-[0_10px_22px_rgba(76,47,94,0.16)]">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Step 2</p>
              <h2 className="text-lg font-semibold text-[#2F1D3B]">Filter cases</h2>
            </div>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              activeFilterPills.length
                ? 'border-[#4C2F5E]/20 bg-[#4C2F5E] text-white'
                : 'border-[#4C2F5E]/10 bg-[#F8F4FB] text-[#4C2F5E]'
            }`}
          >
            {activeFilterPills.length} active
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#736683]">
          Start with the simple filters below. Every active filter appears here and above the results, so users can remove it with one click.
        </p>

        <div className="mt-4 rounded-[18px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Active filters</p>
          {activeFilterPills.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilterPills.map((pill) => (
                <CaseFilterChip
                  key={`sidebar-${pill.key}-${pill.label}`}
                  prefix={filterFieldLabels[pill.key] ?? 'Filter'}
                  label={pill.label}
                  onRemove={() => onClearSingleFilter(pill.key)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[#736683]">
              No filters selected yet. Use category, region, or court to narrow the list.
            </p>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Most used filters</p>
              <p className="mt-1 text-xs text-[#8B7D99]">Best for first-time users</p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4C2F5E]/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#4C2F5E] transition hover:bg-[#F7F3FA] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!activeFilterPills.length}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {coreFilterGroups.map(({ label, key, options }) => {
              const isActive = Boolean(filters[key]);
              const selectedLabel = options.find((option) => option.id === filters[key])?.name;

              return (
                <div key={key} className={isActive ? 'rounded-[16px] border border-[#4C2F5E]/10 bg-[#FBF8FD] p-3' : ''}>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{label}</label>
                    {isActive ? (
                      <span className="rounded-full bg-[#4C2F5E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <select
                    className={selectClass(isActive)}
                    value={filters[key]}
                    onChange={(event) => onFilterChange(key, event.target.value)}
                    aria-label={label}
                  >
                    <option value="">All {label}</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => onClearSingleFilter(key)}
                      className="mt-2 text-xs font-semibold text-[#4C2F5E] hover:underline"
                    >
                      Remove {selectedLabel ?? label}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`mt-4 rounded-[18px] border p-3.5 ${advancedFilterCount ? 'border-[#4C2F5E]/16 bg-[#F6F1FA]' : 'border-[#4C2F5E]/8 bg-[#FBF9FD]'}`}>
          <button
            type="button"
            onClick={onToggleAdvancedFilters}
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={showAdvancedFilters}
            aria-controls="advanced-case-filters"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Advanced filters</p>
              <p className="mt-1 text-sm font-semibold text-[#2F1D3B]">Access, author, status, and source controls</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#6B5C79]">
                {advancedFilterCount ? `${advancedFilterCount} active` : 'Optional'}
              </span>
              <ChevronDown className={`h-4 w-4 text-[#8B7D99] transition ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showAdvancedFilters ? (
            <div id="advanced-case-filters" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 lh-form-enter">
              {advancedTaxonomyGroups.map(({ label, key, options }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">{label}</label>
                  <select
                    className={selectClass(Boolean(filters[key]))}
                    value={filters[key]}
                    onChange={(event) => onFilterChange(key, event.target.value)}
                    aria-label={label}
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

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Source type</label>
                <select
                  className={selectClass(Boolean(filters.sourceType))}
                  value={filters.sourceType}
                  onChange={(event) => onFilterChange('sourceType', event.target.value)}
                  aria-label="Source type"
                >
                  <option value="">All source types</option>
                  {sourceTypes.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Visibility</label>
                <select
                  className={selectClass(Boolean(filters.visibility))}
                  value={filters.visibility}
                  onChange={(event) => onFilterChange('visibility', event.target.value)}
                  aria-label="Visibility"
                >
                  <option value="">All visibility</option>
                  {visibilities.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Status</label>
                <select
                  className={selectClass(Boolean(filters.status))}
                  value={filters.status}
                  onChange={(event) => onFilterChange('status', event.target.value)}
                  aria-label="Status"
                >
                  <option value="">All status</option>
                  {statuses.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Author scope</label>
                <select
                  className={selectClass(Boolean(filters.authorScope))}
                  value={filters.authorScope}
                  onChange={(event) => onFilterChange('authorScope', event.target.value)}
                  aria-label="Author scope"
                >
                  <option value="">All authors</option>
                  <option value="mine">My cases</option>
                  <option value="verified">Verified lawyers only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B7D99]">Date range</label>
                <select
                  className={selectClass(Boolean(filters.dateRange))}
                  value={filters.dateRange}
                  onChange={(event) => onFilterChange('dateRange', event.target.value)}
                  aria-label="Date range"
                >
                  <option value="">All dates</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="workspace-sidebar p-5 lh-page-enter lh-delay-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Quick picks</p>
        <p className="mt-2 text-sm leading-6 text-[#736683]">
          Designed for common search journeys so users do not need to understand the platform’s legal metadata first.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickFilterPresets.map((preset) => {
            const isActive = filters[preset.type] === preset.value;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onQuickFilterToggle(preset.type, preset.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'border-[#4C2F5E]/20 bg-[#4C2F5E] text-white shadow-[0_10px_22px_rgba(76,47,94,0.15)]'
                    : 'border-[#2F1D3B]/8 bg-white text-[#6B5C79] hover:bg-[#F8F6FB]'
                }`}
              >
                {isActive ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : null}
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
