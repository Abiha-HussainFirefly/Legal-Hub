'use client';

import AnimatedLink from '@/app/components/ui/animated-link';
import type { CaseRepositoryFilters, CaseRepositoryRecord } from '@/types/case';
import { BookOpenText, BriefcaseBusiness, CheckCircle2, Sparkles } from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  count: number;
}

interface QuickFilterPreset {
  label: string;
  type: 'sourceType' | 'status' | 'authorScope' | 'visibility';
  value: string;
}

export default function CaseDiscoverySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  quickFilterPresets,
  filters,
  onQuickFilterToggle,
  spotlightCase,
}: {
  categories: CategoryOption[];
  selectedCategory: string;
  onSelectCategory: (value: string) => void;
  quickFilterPresets: readonly QuickFilterPreset[];
  filters: CaseRepositoryFilters;
  onQuickFilterToggle: (type: QuickFilterPreset['type'], value: string) => void;
  spotlightCase: CaseRepositoryRecord | null;
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <div className="workspace-sidebar overflow-hidden p-0">
        <div className="border-b border-[#2F1D3B]/8 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B]">Categories</h2>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-sm font-semibold transition ${
              !selectedCategory
                ? 'bg-[#2F74D0] text-white shadow-[0_12px_24px_rgba(47,116,208,0.18)]'
                : 'text-[#4A3C58] hover:bg-[#F8F6FB]'
            }`}
          >
            <span>View all</span>
            <span className={`${!selectedCategory ? 'text-white/80' : 'text-[#8B7D99]'}`}>All</span>
          </button>

          <div className="mt-2 space-y-1">
            {categories.slice(0, 6).map((category) => {
              const isActive = selectedCategory === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  className={`flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? 'bg-[#F1EAF6] font-semibold text-[#4C2F5E]'
                      : 'font-medium text-[#5E516B] hover:bg-[#F8F6FB]'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-[#8B7D99]">{category.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="workspace-sidebar overflow-hidden p-0">
        <div className="border-b border-[#2F1D3B]/8 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B]">Quick picks</h3>
        </div>

        <div className="p-4">
          <p className="text-sm leading-6 text-[#736683]">
            Common repository views for fast scanning without opening a long sidebar form.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickFilterPresets.map((preset) => {
              const isActive = filters[preset.type] === preset.value;

              return (
                <button
                  key={`${preset.type}-${preset.value}`}
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

      <div className="workspace-sidebar overflow-hidden p-0">
        <div className="border-b border-[#2F1D3B]/8 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#4C2F5E]" />
            <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#2F1D3B]">Spotlight record</h3>
          </div>
        </div>

        <div className="p-4">
          {spotlightCase ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/10 bg-[#F8F4FB] px-3 py-1.5 text-xs font-semibold text-[#4C2F5E]">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                {spotlightCase.category.name}
              </div>
              <p className="mt-4 text-base font-semibold leading-7 text-[#2F1D3B]">
                {spotlightCase.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#736683]">
                {spotlightCase.canonicalCitation || spotlightCase.provenanceLabel}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#736683]">
                {spotlightCase.summary}
              </p>
              <AnimatedLink
                href={`/cases/${spotlightCase.slug}`}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-[#F1EAF6] px-4 py-2 text-sm font-semibold text-[#4C2F5E] transition hover:bg-white"
              >
                <BookOpenText className="h-4 w-4" />
                Open record
              </AnimatedLink>
            </>
          ) : (
            <p className="text-sm leading-6 text-[#736683]">
              Featured cases will appear here as repository authority, citation density, and engagement grow.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
