'use client';

import { CaseSourceBadge, CaseStatusBadge, CaseVisibilityBadge } from '@/app/components/cases/case-badges';
import CaseEmptyState from '@/app/components/cases/case-empty-state';
import CasePageHero from '@/app/components/cases/case-page-hero';
import { getReviewerQueue } from '@/lib/services/case-repository.mock';
import type { CaseRepositoryRecord } from '@/types/case';
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Clock3, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function CaseReviewQueuePage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [apiQueue, setApiQueue] = useState<CaseRepositoryRecord[]>([]);

  useEffect(() => {
    fetch('/api/cases?reviewQueue=true')
      .then(async (response) => {
        if (!response.ok) return;
        const payload = await response.json();
        setApiQueue(payload.data ?? []);
      })
      .catch(() => setApiQueue([]));
  }, []);

  const queue = useMemo(() => {
    const merged = new Map<string, CaseRepositoryRecord>();
    for (const item of getReviewerQueue()) merged.set(item.slug, item);
    for (const item of apiQueue) merged.set(item.slug, item);

    return Array.from(merged.values()).filter((item) => {
      const matchesSearch =
        !search ||
        [item.title, item.canonicalCitation, item.author.displayName, item.organization?.name]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;
      if (status && item.status !== status) return false;
      if (sourceType && item.sourceType !== sourceType) return false;
      return true;
    });
  }, [apiQueue, search, sourceType, status]);

  const metrics = [
    { label: 'Queue size', value: queue.length, icon: BriefcaseBusiness },
    { label: 'Pending review', value: queue.filter((item) => item.status === 'PENDING_REVIEW').length, icon: Clock3 },
    { label: 'Rejected / fixes', value: queue.filter((item) => item.status === 'REJECTED').length, icon: AlertTriangle },
    { label: 'Ready to publish', value: queue.filter((item) => item.status === 'PENDING_REVIEW' && item.sourceLinks.length > 0).length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <CasePageHero
        kicker="Reviewer queue"
        title="Case Review Console"
        description="Review contributor drafts, validate provenance and source health, and move repository records into publishable state."
        aside={
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Quality controls</p>
            <div className="grid gap-3">
              {[
                'Check source health before public release.',
                'Confirm holding language is neutral and legally precise.',
                'Verify organization and visibility boundaries.',
              ].map((item) => (
                <div key={item} className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3 text-sm leading-7 text-white/78">
                  {item}
                </div>
              ))}
            </div>
          </div>
        }
        metrics={metrics.map(({ label, value, icon }) => ({ label, value: `${value}`, icon }))}
      />

      <section className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C7A9B]" />
            <input
              className="legal-field pl-11"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, citation, author, or organization"
            />
          </div>
          <select className="legal-field" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select className="legal-field" value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
            <option value="">All source types</option>
            <option value="USER_SUBMITTED">User submitted</option>
            <option value="OFFICIAL_COURT">Official court</option>
            <option value="IMPORTED_EDITORIAL">Imported editorial</option>
            <option value="COMMUNITY_CURATED">Community curated</option>
          </select>
        </div>
      </section>

      {queue.length ? (
        <div className="space-y-4">
          {queue.map((item) => (
            <article key={item.id} className="rounded-[28px] border border-[#4C2F5E]/10 bg-white p-5 md:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <CaseStatusBadge status={item.status} />
                    <CaseVisibilityBadge visibility={item.visibility} />
                    <CaseSourceBadge sourceType={item.sourceType} />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8C7A9B]">{item.canonicalCitation}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#2F1D3B]">{item.title}</h2>
                  <p className="mt-4 text-sm leading-8 text-[#706181]">{item.summary}</p>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Contributor</p>
                      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{item.author.displayName}</p>
                      <p className="mt-1 text-xs text-[#706181]">{item.organization?.name ?? 'Independent contributor'}</p>
                    </div>
                    <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Source health</p>
                      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{item.trustLabel}</p>
                    </div>
                    <div className="rounded-[20px] border border-[#4C2F5E]/10 bg-[#FBF9FD] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C7A9B]">Flags</p>
                      <p className="mt-2 text-sm font-semibold text-[#2F1D3B]">{item.moderation.aiAlerts} AI alerts / {item.moderation.openReports} reports</p>
                    </div>
                  </div>
                </div>

                <div className="xl:w-[240px]">
                  <Link href={`/case-review/${item.slug}`} className="legal-button-primary w-full text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Open review detail
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <CaseEmptyState
          icon={BriefcaseBusiness}
          title="No records in the review queue"
          description="Reviewer-facing drafts and rejected cases will appear here once contributors submit them."
        />
      )}
    </div>
  );
}
