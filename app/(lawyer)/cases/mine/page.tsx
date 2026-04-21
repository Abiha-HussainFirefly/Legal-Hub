'use client';

import { CaseStatusBadge } from '@/app/components/cases/case-badges';
import CasePageHero from '@/app/components/cases/case-page-hero';
import { useCaseWorkspace } from '@/app/components/cases/case-workspace';
import { getMyCases } from '@/lib/services/case-repository.mock';
import type { CaseRepositoryRecord } from '@/types/case';
import { Archive, ArrowRight, BriefcaseBusiness, PencilLine, Plus, Send } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const boardOrder = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'] as const;

export default function MyCasesPage() {
  const { user } = useCaseWorkspace();
  const mockCases = useMemo(() => getMyCases(user), [user]);
  const [apiCases, setApiCases] = useState<CaseRepositoryRecord[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/cases?authorId=me')
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        setApiCases(payload.data ?? []);
      })
      .catch(() => setApiCases([]));
  }, [user?.id]);

  const cases = useMemo(() => {
    const merged = new Map<string, CaseRepositoryRecord>();
    for (const item of mockCases) merged.set(item.slug, item);
    for (const item of apiCases) merged.set(item.slug, item);
    return Array.from(merged.values());
  }, [apiCases, mockCases]);
  const grouped = useMemo(
    () =>
      boardOrder.map((status) => ({
        status,
        items: cases.filter((item) => item.status === status),
      })),
    [cases],
  );

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 md:px-6 lg:px-8">
      <CasePageHero
        kicker="Contributor dashboard"
        title="My Cases"
        description="Track drafts, monitor review outcomes, and move repository entries from working notes into publishable records."
        actions={
          <Link href="/cases/new" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-[#4C2F5E]">
            <Plus className="h-4 w-4" />
            New case draft
          </Link>
        }
        metrics={[
          { label: 'Total cases', value: `${cases.length}`, icon: BriefcaseBusiness },
          { label: 'Pending review', value: `${cases.filter((item) => item.status === 'PENDING_REVIEW').length}`, icon: Send },
          { label: 'Published', value: `${cases.filter((item) => item.status === 'PUBLISHED').length}`, icon: ArrowRight },
          { label: 'Archived', value: `${cases.filter((item) => item.status === 'ARCHIVED').length}`, icon: Archive },
        ]}
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-5">
        {grouped.map((column) => (
          <section key={column.status} className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <CaseStatusBadge status={column.status} />
              <span className="rounded-full bg-[#F1EAF6] px-3 py-1 text-sm font-semibold text-[#4C2F5E]">{column.items.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {column.items.length ? (
                column.items.map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{item.canonicalCitation}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#2F1D3B]">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-[#6F5E7F]">{item.summary}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <Link href={`/cases/${item.slug}`} className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-xs font-semibold text-[#4C2F5E]">
                        View
                      </Link>
                      <Link href={`/cases/${item.slug}/edit`} className="inline-flex items-center gap-2 rounded-full border border-[#4C2F5E]/12 bg-white px-4 py-2 text-xs font-semibold text-[#4C2F5E]">
                        <PencilLine className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-4 py-8 text-sm text-[#706181]">
                  No items in this state.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
