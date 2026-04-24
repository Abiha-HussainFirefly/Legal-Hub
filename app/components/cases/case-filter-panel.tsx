'use client';

import type { CaseRepositoryFilters } from '@/types/case';
import { Filter, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface CourtOption extends Option {
  level?: string;
}

export default function CaseFilterPanel({
  filters,
  activeFilterCount,
  taxonomyGroups,
  sourceTypes,
  visibilities,
  statuses,
  onChange,
  onReset,
}: {
  filters: CaseRepositoryFilters;
  activeFilterCount: number;
  taxonomyGroups: Array<{
    label: string;
    key: 'category' | 'tag' | 'region' | 'court' | 'organization';
    options: Option[] | CourtOption[];
  }>;
  sourceTypes: string[];
  visibilities: string[];
  statuses: string[];
  onChange: (key: keyof CaseRepositoryFilters, value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[#4C2F5E]/10 bg-white p-5 shadow-[0_12px_30px_rgba(76,47,94,0.05)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
          <Filter className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Structured filters</p>
          <h2 className="text-lg font-semibold text-[#2F1D3B]">Refine results</h2>
        </div>
      </div>

      <div className="mt-5 rounded-[22px] border border-[#4C2F5E]/8 bg-[#FBF9FD] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Filters applied</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{activeFilterCount}</p>
          </div>
          {activeFilterCount ? (
            <button
              onClick={onReset}
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

      <div className="mt-5 space-y-4">
        {taxonomyGroups.map(({ label, key, options }) => (
          <div key={key}>
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{label}</label>
            <select
              className="legal-field mt-2"
              value={filters[key]}
              onChange={(event) => onChange(key, event.target.value)}
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
            <select className="legal-field mt-2" value={filters.sourceType} onChange={(event) => onChange('sourceType', event.target.value)}>
              <option value="">All source types</option>
              {sourceTypes.map((option) => (
                <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Visibility</label>
            <select className="legal-field mt-2" value={filters.visibility} onChange={(event) => onChange('visibility', event.target.value)}>
              <option value="">All visibility</option>
              {visibilities.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Status</label>
            <select className="legal-field mt-2" value={filters.status} onChange={(event) => onChange('status', event.target.value)}>
              <option value="">All status</option>
              {statuses.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Author scope</label>
            <select className="legal-field mt-2" value={filters.authorScope} onChange={(event) => onChange('authorScope', event.target.value)}>
              <option value="">All authors</option>
              <option value="mine">My cases</option>
              <option value="verified">Verified lawyers only</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Date range</label>
            <select className="legal-field mt-2" value={filters.dateRange} onChange={(event) => onChange('dateRange', event.target.value)}>
              <option value="">All dates</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>

        <button onClick={onReset} className="legal-button-secondary w-full text-sm">
          Reset filters
        </button>
      </div>
    </div>
  );
}
