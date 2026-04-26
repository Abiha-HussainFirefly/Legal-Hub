'use client';

import { Filter, RotateCcw } from 'lucide-react';
import type { CaseRepositoryFilters } from '@/types/case';
import CaseFilterChip from '@/app/components/cases/case-filter-chip';

interface ActiveFilterPill {
  key: keyof CaseRepositoryFilters;
  label: string;
}

export default function CaseResultsHeader({
  loading,
  resultsCount,
  filterSummaryText,
  activeFilterPills,
  filterFieldLabels,
  onClearSingleFilter,
  onReset,
}: {
  loading: boolean;
  resultsCount: number;
  filterSummaryText: string;
  activeFilterPills: ActiveFilterPill[];
  filterFieldLabels: Partial<Record<keyof CaseRepositoryFilters, string>>;
  onClearSingleFilter: (key: keyof CaseRepositoryFilters) => void;
  onReset: () => void;
}) {
  return (
    <>
      <div className="mb-4 rounded-[20px] border border-[#2F1D3B]/8 bg-white px-4 py-4 shadow-[0_10px_22px_rgba(16,27,40,0.03)] sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Step 3 / Results</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#2F1D3B]" aria-live="polite">
              {loading ? 'Loading case records...' : `${resultsCount} record${resultsCount === 1 ? '' : 's'} shown`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#736683]">{filterSummaryText}</p>
          </div>
          <a
            href="#case-filters"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-[#F7F3FA] px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-white xl:hidden"
          >
            <Filter className="h-4 w-4" />
            Change filters
          </a>
        </div>
      </div>

      {activeFilterPills.length ? (
        <div className="mb-4 rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF8FD] p-3.5 shadow-[0_10px_22px_rgba(16,27,40,0.03)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B7D99]">Tap a chip to remove it</p>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-3 py-2 text-xs font-semibold text-[#4C2F5E] transition hover:bg-[#F1EAF6]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilterPills.map((pill) => (
              <CaseFilterChip
                key={`${pill.key}-${pill.label}`}
                prefix={filterFieldLabels[pill.key] ?? 'Filter'}
                label={pill.label}
                onRemove={() => onClearSingleFilter(pill.key)}
                tone="strong"
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
