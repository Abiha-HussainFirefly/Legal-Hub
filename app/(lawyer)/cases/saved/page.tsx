'use client';

import CaseResultCard from '@/app/components/cases/case-result-card';
import CasePageHero from '@/app/components/cases/case-page-hero';
import { useCaseWorkspace } from '@/app/components/cases/case-workspace';
import { useToast } from '@/app/components/ui/toast/toast-context';
import type { CaseRepositoryRecord } from '@/types/case';
import { Bookmark, Clock3, Eye, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function SavedCasesPage() {
  const { user } = useCaseWorkspace();
  const { addToast } = useToast();
  const [savedCases, setSavedCases] = useState<CaseRepositoryRecord[]>([]);
  const canFetchSavedCases = Boolean(user?.id);

  useEffect(() => {
    let cancelled = false;

    if (!canFetchSavedCases) {
      return;
    }

    fetch('/api/cases?savedBy=me&sort=recent')
      .then(async (response) => {
        const payload = (await response.json()) as { data?: CaseRepositoryRecord[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load saved cases.');
        }
        if (!cancelled) {
          setSavedCases(payload.data ?? []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setSavedCases([]);
          addToast('error', 'Saved cases unavailable', error instanceof Error ? error.message : 'Unable to load saved cases.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [addToast, canFetchSavedCases]);

  const collections = useMemo(
    () => ({
      saved: canFetchSavedCases ? savedCases : [],
      followed: [] as CaseRepositoryRecord[],
      recent: canFetchSavedCases ? savedCases.slice(0, 3) : [],
    }),
    [canFetchSavedCases, savedCases],
  );

  return (
    <div className="mx-auto max-w-[1260px] px-4 py-8 md:px-6 lg:px-8">
      <CasePageHero
        kicker="Personal library"
        title="Saved & Followed Cases"
        description="Keep high-value decisions close, follow records that may update after review, and revisit recent case research."
        metrics={[
          { label: 'Saved', value: `${collections.saved.length}`, icon: Bookmark },
          { label: 'Followed', value: `${collections.followed.length}`, icon: Users },
          { label: 'Recent', value: `${collections.recent.length}`, icon: Clock3 },
        ]}
      />

      <div className="mt-6 space-y-6">
        <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
              <Bookmark className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Bookmarked</p>
              <h2 className="text-xl font-semibold text-[#2F1D3B]">Saved cases</h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {collections.saved.length ? (
              collections.saved.map((item) => <CaseResultCard key={item.id} item={item} />)
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-4 py-8 text-sm text-[#706181]">
                No saved cases yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Watching for updates</p>
              <h2 className="text-xl font-semibold text-[#2F1D3B]">Followed cases</h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {collections.followed.length ? (
              collections.followed.map((item) => <CaseResultCard key={item.id} item={item} compact />)
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-4 py-8 text-sm text-[#706181]">
                Follow tracking is not available in this workspace yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F1EAF6] text-[#4C2F5E]">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">Research memory</p>
              <h2 className="text-xl font-semibold text-[#2F1D3B]">Recently viewed</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {collections.recent.length ? (
              collections.recent.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">{item.canonicalCitation}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#2F1D3B]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#706181]">{item.summary}</p>
                  <Link href={`/cases/${item.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#4C2F5E]">
                    Open record
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#4C2F5E]/15 bg-[#FBF9FD] px-5 py-8 text-sm text-[#706181] lg:col-span-3">
                Your recent saved cases will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
